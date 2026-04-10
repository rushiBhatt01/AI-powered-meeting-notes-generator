"use server";

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { API_CONFIG } from "@/lib/api-config";

type ErrorResponse = {
  detail?: string;
  error?: string;
  message?: string;
};

function getUnexpectedResponseMessage(response: Response, body: string): string {
  const trimmedBody = body.trim();
  const endpoint = API_CONFIG.getUrl("summarize");

  if (trimmedBody.startsWith("<!DOCTYPE") || trimmedBody.startsWith("<html")) {
    return `Unexpected HTML response from ${endpoint}. Call the route directly from the client or forward auth cookies when using a Server Action.`;
  }

  return trimmedBody || `Unexpected non-JSON response from ${endpoint} (HTTP ${response.status}).`;
}

async function getErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const errorData = (await response.json()) as ErrorResponse;
      return (
        errorData.detail ??
        errorData.error ??
        errorData.message ??
        `Failed to summarize text (HTTP ${response.status})`
      );
    }

    const errorText = await response.text();
    if (errorText.trim()) {
      return getUnexpectedResponseMessage(response, errorText);
    }
  } catch {
    // Fall through to the generic message below.
  }

  return `Failed to summarize text (HTTP ${response.status})`;
}

async function getSuccessPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const responseText = await response.text();
    throw new Error(getUnexpectedResponseMessage(response, responseText));
  }

  return (await response.json()) as { summary?: string };
}

export async function summarizeText(text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!text || text.trim() === "") {
    throw new Error("No text provided");
  }

  try {
    const cookie = (await headers()).get("cookie");
    const response = await fetch(API_CONFIG.getUrl("summarize"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const data = await getSuccessPayload(response);
    return data.summary as string;
  } catch (error) {
    console.error("Summarization Error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to summarize text");
  }
}
