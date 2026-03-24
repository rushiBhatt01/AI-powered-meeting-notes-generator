import { inngest } from "./client";
import { db } from "@/db";
import { meetings, imps, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractIntelligence } from "@/lib/ai/extract";

export const processTranscript = inngest.createFunction(
  {
    id: "process-transcript",
    name: "Process Meeting Transcript",
    triggers: [{ event: "transcript.process" }],
  },
  async ({ event, step }) => {
    const { meetingId } = event.data as { meetingId: number };

    // ─── Step 1: Fetch Transcript ─────────────────────────
    const meeting = await step.run("fetch-transcript", async () => {
      const [result] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, meetingId))
        .limit(1);

      if (!result) throw new Error(`Meeting ${meetingId} not found`);

      // Update status to processing
      await db
        .update(meetings)
        .set({ status: "processing", updated_at: new Date() })
        .where(eq(meetings.id, meetingId));

      return result;
    });

    // ─── Step 1.5: Fetch User Settings ────────────────────
    const piiEnabled = await step.run("fetch-user-settings", async () => {
      const [user] = await db
        .select({ pii_redaction_enabled: users.pii_redaction_enabled })
        .from(users)
        .where(eq(users.clerk_id, meeting.user_id))
        .limit(1);
      return user?.pii_redaction_enabled ?? false;
    });

    // ─── Step 2: AI Extraction ────────────────────────────
    const extraction = await step.run("ai-extraction", async () => {
      const result = await extractIntelligence(meeting.raw_transcript, piiEnabled);
      return result;
    });

    // ─── Step 3: Fidelity Check & Persistence ─────────────
    await step.run("fidelity-check", async () => {
      const impRecords = [];

      // Summary
      if (extraction.summary) {
        impRecords.push({
          meeting_id: meetingId,
          type: "summary" as const,
          description: extraction.summary,
          is_low_confidence: false,
        });
      }

      // Action Items (with owner attribution — Story 3.4)
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

      // Decisions
      for (const item of extraction.decisions ?? []) {
        impRecords.push({
          meeting_id: meetingId,
          type: "decision" as const,
          description: item.description,
          source_snippet: item.source_snippet || null,
          is_low_confidence: item.is_low_confidence ?? !item.source_snippet,
        });
      }

      // Deadlines
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

      // Batch insert all imps
      if (impRecords.length > 0) {
        await db.insert(imps).values(impRecords);
      }

      // Update meeting with summary and status
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

      return { impCount: impRecords.length };
    });

    return { success: true, meetingId };
  }
);
