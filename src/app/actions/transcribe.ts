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
  const endpoint = API_CONFIG.getUrl("transcribe");

  if (trimmedBody.startsWith("<!DOCTYPE") || trimmedBody.startsWith("<html")) {
    return `Unexpected HTML response from ${endpoint}. Call the route directly from the client or forward auth cookies when using a Server Action.`;
  }

  return trimmedBody || `Unexpected non-JSON response from ${endpoint} (HTTP ${response.status}).`;
}

async function getErrorMessage(response: Response): Promise<string> {
  if (response.status === 413) {
    return "Audio file is too large for inline serverless upload.";
  }

  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const errorData = (await response.json()) as ErrorResponse;
      return (
        errorData.detail ??
        errorData.error ??
        errorData.message ??
        `Failed to transcribe audio file (HTTP ${response.status})`
      );
    }

    const errorText = await response.text();
    if (errorText.trim()) {
      return getUnexpectedResponseMessage(response, errorText);
    }
  } catch {
    // Fall through to the generic message below.
  }

  return `Failed to transcribe audio file (HTTP ${response.status})`;
}

async function getSuccessPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const responseText = await response.text();
    throw new Error(getUnexpectedResponseMessage(response, responseText));
  }

  return (await response.json()) as { text?: string };
}

export async function transcribeAudio(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("No file provided");

  try {
    // For large files, use a longer timeout (20 minutes for processing + buffer)
    const controller = new AbortController();
    const timeout = 25 * 60 * 1000; // 25 minutes
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const cookie = (await headers()).get("cookie");

    const response = await fetch(API_CONFIG.getUrl("transcribe"), {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers: cookie ? { cookie } : undefined,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const data = await getSuccessPayload(response);
    return data.text as string;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Transcription took too long. Please try with a shorter audio file.");
    }
    console.error("Transcription Error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to transcribe audio file");
  }
}
