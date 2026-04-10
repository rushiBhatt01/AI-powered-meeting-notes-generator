"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { meetings, imps } from "@/db/schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { createMeetingForUser, dispatchMeetingProcessing } from "@/lib/meeting-workflow";

export async function createMeeting(formData: {
  title: string;
  meetingDate: string;
  rawTranscript: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const meetingId = await createMeetingForUser(userId, formData);
  redirect(`/dashboard/meetings/${meetingId}`);
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
