import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_UPLOAD_BYTES = 500 * 1024 * 1024;
const BLOB_UPLOAD_ENDPOINT = "/api/blob/upload";

function getPublicOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = (forwardedHost ?? request.headers.get("host"))?.split(",")[0]?.trim();
  const proto = (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", ""))
    .split(",")[0]
    .trim();

  if (host) {
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

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
        const callbackUrl = `${getPublicOrigin(request)}${BLOB_UPLOAD_ENDPOINT}`;
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized");
        }

        const tokenConfig = {
          allowedContentTypes: ["audio/*", "application/octet-stream"],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_AUDIO_UPLOAD_BYTES,
          callbackUrl,
          tokenPayload: JSON.stringify({ userId }),
        };

        return tokenConfig;
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Audio blob upload completed.", {
          pathname: blob.pathname,
          url: blob.url,
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
