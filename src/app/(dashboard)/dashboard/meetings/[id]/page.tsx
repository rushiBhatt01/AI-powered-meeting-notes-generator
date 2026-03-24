import { db } from "@/db";
import { meetings, imps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import MeetingDetailClient from "./meeting-detail-client";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meetingId = parseInt(id, 10);
  if (isNaN(meetingId)) notFound();

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) notFound();

  const meetingImps = await db
    .select()
    .from(imps)
    .where(eq(imps.meeting_id, meetingId))
    .orderBy(imps.id);

  return <MeetingDetailClient meeting={meeting} imps={meetingImps} />;
}
