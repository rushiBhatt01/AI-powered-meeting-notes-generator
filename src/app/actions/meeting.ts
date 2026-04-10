"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { meetings, imps } from "@/db/schema";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { processMeetingTranscript } from "@/inngest/process-transcript";

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

async function dispatchMeetingProcessing(meetingId: number) {
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

export async function createMeeting(formData: {
  title: string;
  meetingDate: string;
  rawTranscript: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const title = formData.title.trim() || "Untitled Meeting";
  const meetingDate = formData.meetingDate
    ? new Date(formData.meetingDate)
    : new Date();

  const [inserted] = await db
    .insert(meetings)
    .values({
      user_id: userId,
      title,
      meeting_date: meetingDate,
      raw_transcript: formData.rawTranscript,
      status: "queued",
    })
    .returning({ id: meetings.id });

  await dispatchMeetingProcessing(inserted.id);

  redirect(`/dashboard/meetings/${inserted.id}`);
}

export async function retryMeetingProcessing(meetingId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [meeting] = await db
    .select({ id: meetings.id, status: meetings.status })
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.user_id, userId)))
    .limit(1);

  if (!meeting) throw new Error("Meeting not found");
  if (meeting.status !== "failed") {
    throw new Error("Only failed meetings can be retried");
  }

  await db.delete(imps).where(eq(imps.meeting_id, meetingId));

  await db
    .update(meetings)
    .set({
      status: "queued",
      summary: null,
      action_items: null,
      decisions: null,
      updated_at: new Date(),
    })
    .where(eq(meetings.id, meetingId));

  await dispatchMeetingProcessing(meetingId);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/meetings/${meetingId}`);
}

export async function deleteMeeting(meetingId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [meeting] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.user_id, userId)))
    .limit(1);

  if (!meeting) throw new Error("Meeting not found");

  await db.delete(imps).where(eq(imps.meeting_id, meetingId));
  await db.delete(meetings).where(eq(meetings.id, meetingId));

  redirect("/dashboard");
}
