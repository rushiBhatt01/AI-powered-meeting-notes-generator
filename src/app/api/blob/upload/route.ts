import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_UPLOAD_BYTES = 500 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: ["audio/*", "application/octet-stream"],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_AUDIO_UPLOAD_BYTES,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Audio blob upload completed.", {
          pathname: blob.pathname,
          size: blob.size,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare upload token.";
    const status = message === "Unauthorized" ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
