import { eq } from "drizzle-orm";
import { db } from "@/db";
import { meetings, imps, users } from "@/db/schema";
import { extractIntelligence } from "@/lib/ai/extract";

export async function processMeetingTranscript(meetingId: number) {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  if (!meeting) {
    throw new Error(`Meeting ${meetingId} not found`);
  }

  await db
    .update(meetings)
    .set({ status: "processing", updated_at: new Date() })
    .where(eq(meetings.id, meetingId));

  try {
    const [user] = await db
      .select({ pii_redaction_enabled: users.pii_redaction_enabled })
      .from(users)
      .where(eq(users.clerk_id, meeting.user_id))
      .limit(1);

    const extraction = await extractIntelligence(
      meeting.raw_transcript,
      user?.pii_redaction_enabled ?? false,
    );

    const impRecords = [];

    if (extraction.summary) {
      impRecords.push({
        meeting_id: meetingId,
        type: "summary" as const,
        description: extraction.summary,
        is_low_confidence: false,
      });
    }

    for (const item of extraction.action_items ?? []) {
      impRecords.push({
        meeting_id: meetingId,
        type: "action_item" as const,
        description: item.description,
        owner_name: item.owner || "Unassigned",
        source_snippet: item.source_snippet || null,
        is_low_confidence: item.is_low_confidence ?? !item.source_snippet,
      });
    }

    for (const item of extraction.decisions ?? []) {
      impRecords.push({
        meeting_id: meetingId,
        type: "decision" as const,
        description: item.description,
        source_snippet: item.source_snippet || null,
        is_low_confidence: item.is_low_confidence ?? !item.source_snippet,
      });
    }

    for (const item of extraction.deadlines ?? []) {
      impRecords.push({
        meeting_id: meetingId,
        type: "deadline" as const,
        description: item.description,
        date_info: item.date || null,
        source_snippet: item.source_snippet || null,
        is_low_confidence: item.is_low_confidence ?? !item.source_snippet,
      });
    }

    await db.delete(imps).where(eq(imps.meeting_id, meetingId));

    if (impRecords.length > 0) {
      await db.insert(imps).values(impRecords);
    }

    await db
      .update(meetings)
      .set({
        summary: extraction.summary || null,
        action_items: JSON.stringify(extraction.action_items || []),
        decisions: JSON.stringify(extraction.decisions || []),
        status: "completed",
        updated_at: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    return { success: true, meetingId, impCount: impRecords.length };
  } catch (error) {
    await db
      .update(meetings)
      .set({ status: "failed", updated_at: new Date() })
      .where(eq(meetings.id, meetingId));

    throw error;
  }
}
