import { API_CONFIG } from "@/lib/api-config";

const TRANSCRIPTION_TIMEOUT_MS = 25 * 60 * 1000;

type TranscriptionResponse = {
  text?: string;
};

type ErrorResponse = {
  detail?: string;
  error?: string;
  message?: string;
};

function getUnexpectedResponseMessage(response: Response, body: string): string {
  const trimmedBody = body.trim();
  const endpoint = API_CONFIG.getUrl("transcribe");

  if (trimmedBody.startsWith("<!DOCTYPE") || trimmedBody.startsWith("<html")) {
    return `Unexpected HTML response from ${endpoint}. Check that serverless mode is configured correctly and that you're signed in.`;
  }

  return trimmedBody || `Unexpected non-JSON response from ${endpoint} (HTTP ${response.status}).`;
}

async function getErrorMessage(response: Response): Promise<string> {
  if (response.status === 413) {
    return "Audio file is too large for serverless upload. Use an audio file up to 4MB.";
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
    if (errorText.trim().length > 0) {
      return errorText;
    }
  } catch {
    // Fall through to the generic message below.
  }

  return `Failed to transcribe audio file (HTTP ${response.status})`;
}

async function getSuccessPayload(response: Response): Promise<TranscriptionResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const responseText = await response.text();
    throw new Error(getUnexpectedResponseMessage(response, responseText));
  }

  return (await response.json()) as TranscriptionResponse;
}

export async function transcribeAudioDirect(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);

  try {
    const response = await fetch(API_CONFIG.getUrl("transcribe"), {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const data = await getSuccessPayload(response);
    if (!data.text) {
      throw new Error("Transcription response did not include text.");
    }

    return data.text;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Transcription took too long. Please try again or use a shorter audio file.");
    }

    if (error instanceof TypeError) {
      throw new Error(
        `Could not reach the transcription endpoint at ${API_CONFIG.getUrl("transcribe")}. Check NEXT_PUBLIC_APP_URL and Vercel deployment settings.`,
      );
    }

    throw error instanceof Error ? error : new Error("Failed to transcribe audio file");
  } finally {
    clearTimeout(timeoutId);
  }
}
