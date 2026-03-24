"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { meetings, imps } from "@/db/schema";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/inngest/client";

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

  // Trigger the Inngest AI pipeline
  await inngest.send({
    name: "transcript.process",
    data: { meetingId: inserted.id },
  });

  redirect(`/dashboard/meetings/${inserted.id}`);
}

export async function deleteMeeting(meetingId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership
  const [meeting] = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.user_id, userId)))
    .limit(1);

  if (!meeting) throw new Error("Meeting not found");

  // Cascading delete: remove imps first, then the meeting
  await db.delete(imps).where(eq(imps.meeting_id, meetingId));
  await db.delete(meetings).where(eq(meetings.id, meetingId));

  redirect("/dashboard");
}
