import "server-only";

import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { processMeetingTranscript } from "@/inngest/process-transcript";

export type CreateMeetingInput = {
  title: string;
  meetingDate: string;
  rawTranscript: string;
};

function isInngestDevMode() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const devValue = process.env.INNGEST_DEV;
  if (!devValue) {
    return false;
  }

  return devValue === "1" || devValue === "true" || devValue.startsWith("http");
}

export async function dispatchMeetingProcessing(meetingId: number) {
  const inngestDevMode = isInngestDevMode();

  const missingInngestEnv = [
    !process.env.INNGEST_EVENT_KEY ? "INNGEST_EVENT_KEY" : null,
    !process.env.INNGEST_SIGNING_KEY ? "INNGEST_SIGNING_KEY" : null,
  ].filter((value): value is string => Boolean(value));

  if (!inngestDevMode && missingInngestEnv.length > 0) {
    await db
      .update(meetings)
      .set({ status: "failed", updated_at: new Date() })
      .where(eq(meetings.id, meetingId));

    throw new Error(
      `Missing required Inngest env var(s): ${missingInngestEnv.join(", ")}. Set them in Vercel to enable meeting processing.`,
    );
  }

  try {
    await inngest.send({
      name: "transcript.process",
      data: { meetingId },
    });
  } catch (error) {
    if (!inngestDevMode) {
      await db
        .update(meetings)
        .set({ status: "failed", updated_at: new Date() })
        .where(eq(meetings.id, meetingId));

      throw error;
    }

    console.error(
      "Inngest event dispatch failed in dev mode; falling back to local processing.",
      error,
    );

    after(async () => {
      try {
        await processMeetingTranscript(meetingId);
      } catch (fallbackError) {
        console.error("Local transcript processing fallback failed.", fallbackError);
      }
    });
  }
}

export async function createMeetingForUser(userId: string, input: CreateMeetingInput): Promise<number> {
  const title = input.title.trim() || "Untitled Meeting";
  const meetingDate = input.meetingDate ? new Date(input.meetingDate) : new Date();

  if (Number.isNaN(meetingDate.getTime())) {
    throw new Error("Invalid meeting date.");
  }

  if (!input.rawTranscript.trim()) {
    throw new Error("Transcript is required.");
  }

  const [inserted] = await db
    .insert(meetings)
    .values({
      user_id: userId,
      title,
      meeting_date: meetingDate,
      raw_transcript: input.rawTranscript,
      status: "queued",
    })
    .returning({ id: meetings.id });

  await dispatchMeetingProcessing(inserted.id);
  return inserted.id;
}
