import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const ASSEMBLYAI_UPLOAD_URL = "https://api.assemblyai.com/v2/upload";
const ASSEMBLYAI_TRANSCRIPT_URL = "https://api.assemblyai.com/v2/transcript";
const ASSEMBLYAI_SPEECH_MODELS = ["universal-2"] as const;
const MAX_AUDIO_UPLOAD_BYTES = 4 * 1024 * 1024;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

type AssemblyAIUploadResponse = {
  upload_url?: string;
};

type AssemblyAITranscriptResponse = {
  error?: string;
  id?: string;
  status?: string;
  text?: string;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getResponseMessage(response: Response, fallback: string) {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as Record<string, unknown>;
      const candidates = [payload.error, payload.message];

      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate;
        }
      }
    }

    const responseText = await response.text();
    if (responseText.trim()) {
      return responseText.trim();
    }
  } catch {
    // Fall back to the generic message below.
  }

  return `${fallback} (HTTP ${response.status})`;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }

  const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
  if (!assemblyAIKey) {
    return errorResponse("ASSEMBLYAI_API_KEY is not configured.", 500);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid upload payload.", 400);
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return errorResponse("No audio file provided.", 400);
  }

  if (fileEntry.size === 0) {
    return errorResponse("Audio file is empty.", 400);
  }

  if (fileEntry.size > MAX_AUDIO_UPLOAD_BYTES) {
    return errorResponse(
      `Audio file is too large (${(fileEntry.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 4MB for serverless uploads.`,
      413,
    );
  }

  try {
    const uploadResponse = await fetch(ASSEMBLYAI_UPLOAD_URL, {
      method: "POST",
      headers: {
        authorization: assemblyAIKey,
        "content-type": "application/octet-stream",
      },
      body: await fileEntry.arrayBuffer(),
    });

    if (!uploadResponse.ok) {
      return errorResponse(
        await getResponseMessage(uploadResponse, "Failed to upload audio to AssemblyAI."),
        502,
      );
    }

    const uploadData = (await uploadResponse.json()) as AssemblyAIUploadResponse;
    if (!uploadData.upload_url) {
      return errorResponse("AssemblyAI did not return an upload URL.", 502);
    }

    const transcriptResponse = await fetch(ASSEMBLYAI_TRANSCRIPT_URL, {
      method: "POST",
      headers: {
        authorization: assemblyAIKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: uploadData.upload_url,
        speech_models: ASSEMBLYAI_SPEECH_MODELS,
      }),
    });

    if (!transcriptResponse.ok) {
      return errorResponse(
        await getResponseMessage(
          transcriptResponse,
          "Failed to start the AssemblyAI transcription job.",
        ),
        502,
      );
    }

    const transcriptJob = (await transcriptResponse.json()) as AssemblyAITranscriptResponse;
    if (!transcriptJob.id) {
      return errorResponse("AssemblyAI did not return a transcription job ID.", 502);
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const pollResponse = await fetch(`${ASSEMBLYAI_TRANSCRIPT_URL}/${transcriptJob.id}`, {
        headers: {
          authorization: assemblyAIKey,
        },
      });

      if (!pollResponse.ok) {
        return errorResponse(
          await getResponseMessage(
            pollResponse,
            "Failed while polling the AssemblyAI transcription job.",
          ),
          502,
        );
      }

      const transcript = (await pollResponse.json()) as AssemblyAITranscriptResponse;

      if (transcript.status === "completed") {
        if (!transcript.text) {
          return errorResponse("Transcription completed without returning text.", 502);
        }

        return NextResponse.json({ text: transcript.text });
      }

      if (transcript.status === "error") {
        return errorResponse(transcript.error || "AssemblyAI transcription failed.", 502);
      }

      await sleep(POLL_INTERVAL_MS);
    }

    return errorResponse("Transcription timed out while waiting for AssemblyAI.", 504);
  } catch (error) {
    console.error("Transcription route error:", error);
    return errorResponse("Failed to transcribe audio.", 500);
  }
}
