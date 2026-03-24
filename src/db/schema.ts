import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Users Table ─────────────────────────────────────────────
// Maps Clerk identities to internal user records.
// Naming: snake_case for all columns (AD8).

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerk_id: text("clerk_id").notNull(),
    email: text("email").notNull(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    pii_redaction_enabled: boolean("pii_redaction_enabled").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("clerk_id_idx").on(table.clerk_id)]
);

// Type exports for use in Server Actions and Inngest functions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ─── Meetings Table ──────────────────────────────────────────
// Stores meeting transcripts and AI-processed output.
// Naming: snake_case for all columns (AD8).

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(), // Clerk user ID
  title: text("title").notNull().default("Untitled Meeting"),
  meeting_date: timestamp("meeting_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  raw_transcript: text("raw_transcript").notNull(),
  status: text("status").notNull().default("draft"), // draft | processing | completed | failed
  summary: text("summary"),
  action_items: text("action_items"),
  decisions: text("decisions"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

// ─── Imps Table ──────────────────────────────────────────────
// Stores extracted intelligence points (summaries, tasks, decisions, deadlines).
// Each "Imp" is a single piece of extracted intelligence from a meeting.

export const imps = pgTable("imps", {
  id: serial("id").primaryKey(),
  meeting_id: integer("meeting_id")
    .notNull()
    .references(() => meetings.id),
  type: text("type").notNull(), // summary | action_item | decision | deadline
  description: text("description").notNull(),
  owner_name: text("owner_name"), // For action items: person assigned
  source_snippet: text("source_snippet"), // Verbatim quote from transcript
  is_low_confidence: boolean("is_low_confidence").default(false).notNull(),
  date_info: text("date_info"), // For deadlines: date string
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Imp = typeof imps.$inferSelect;
export type NewImp = typeof imps.$inferInsert;
