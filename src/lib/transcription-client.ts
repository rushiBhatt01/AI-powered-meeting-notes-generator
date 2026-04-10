import { upload } from "@vercel/blob/client";
import { API_CONFIG } from "@/lib/api-config";

const TRANSCRIPTION_TIMEOUT_MS = 25 * 60 * 1000;
const MAX_INLINE_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_BLOB_AUDIO_BYTES = 500 * 1024 * 1024;
const BLOB_UPLOAD_ENDPOINT = "/api/blob/upload";

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
    return "Audio file is too large for inline serverless upload. Large files are uploaded directly first, then transcribed.";
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

function getSafeBlobPath(fileName: string): string {
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `audio/${Date.now()}-${cleanName}`;
}

async function startTranscriptionFromAudioUrl(audioUrl: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(API_CONFIG.getUrl("transcribe"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ audioUrl }),
    signal,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data = await getSuccessPayload(response);
  if (!data.text) {
    throw new Error("Transcription response did not include text.");
  }

  return data.text;
}

export async function transcribeAudioDirect(file: File): Promise<string> {
  if (file.size > MAX_BLOB_AUDIO_BYTES) {
    throw new Error(
      `Audio file is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 500MB.`,
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);

  try {
    if (file.size > MAX_INLINE_UPLOAD_BYTES) {
      const blobUpload = await upload(getSafeBlobPath(file.name), file, {
        access: "public",
        handleUploadUrl: BLOB_UPLOAD_ENDPOINT,
        multipart: true,
        abortSignal: controller.signal,
      });

      return await startTranscriptionFromAudioUrl(blobUpload.url, controller.signal);
    }

    const formData = new FormData();
    formData.append("file", file);

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
        `Could not reach the upload/transcription backend. Check NEXT_PUBLIC_APP_URL, BLOB_READ_WRITE_TOKEN, and Vercel deployment settings.`,
      );
    }

    throw error instanceof Error ? error : new Error("Failed to transcribe audio file");
  } finally {
    clearTimeout(timeoutId);
  }
}
