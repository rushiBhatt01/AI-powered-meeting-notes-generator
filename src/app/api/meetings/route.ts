import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createMeetingForUser } from "@/lib/meeting-workflow";

type CreateMeetingRequest = {
  meetingDate?: unknown;
  rawTranscript?: unknown;
  title?: unknown;
};

export const runtime = "nodejs";
export const maxDuration = 60;

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateMeetingRequest;
  try {
    payload = (await request.json()) as CreateMeetingRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const rawTranscript = toStringValue(payload.rawTranscript).trim();
  if (!rawTranscript) {
    return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
  }

  const title = toStringValue(payload.title);
  const meetingDate = toStringValue(payload.meetingDate);

  try {
    const meetingId = await createMeetingForUser(userId, {
      title,
      meetingDate,
      rawTranscript,
    });

    return NextResponse.json({ meetingId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create meeting.";
    const status = message === "Invalid meeting date." ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
