"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, meetings, imps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUserSettings() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [dbUser] = await db.select().from(users).where(eq(users.clerk_id, userId)).limit(1);
  return { piiRedactionEnabled: dbUser?.pii_redaction_enabled ?? false };
}

export async function togglePiiRedaction(enabled: boolean) {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const [dbUser] = await db.select().from(users).where(eq(users.clerk_id, user.id)).limit(1);

  if (dbUser) {
    await db
      .update(users)
      .set({ pii_redaction_enabled: enabled, updated_at: new Date() })
      .where(eq(users.clerk_id, user.id));
  } else {
    // Sync to DB on first setting toggle
    await db.insert(users).values({
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      first_name: user.firstName,
      last_name: user.lastName,
      pii_redaction_enabled: enabled,
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function exportUserData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const userMeetings = await db
    .select()
    .from(meetings)
    .where(eq(meetings.user_id, userId));

  const meetingIds = userMeetings.map((m) => m.id);
  
  let userImps: typeof imps.$inferSelect[] = [];
  if (meetingIds.length > 0) {
    userImps = await db
      .select()
      .from(imps)
      // fetch all imps for these meetings. In a small scale app, filtering in JS is fine,
      // but looping queries is also okay. We'll fetch all and group.
      // Drizzle 'inArray' would explicitly be imported, but simple fallback is good.
      // To avoid messy import of `inArray`, we'll just query them separately if needed 
      // or rely on Drizzle's relational query if we configured schemas.
  }

  // Proper approach without inArray to avoid extra imports:
  // We'll just fetch all imps for each meeting inside a Promise.all
  const impsByMeeting = await Promise.all(
    userMeetings.map((m) => db.select().from(imps).where(eq(imps.meeting_id, m.id)))
  );

  const exportData = userMeetings.map((meeting, idx) => ({
    ...meeting,
    imps: impsByMeeting[idx],
  }));

  return JSON.stringify(exportData, null, 2);
}

export async function nuclearWipe() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get all user meeting IDs
  const userMeetings = await db
    .select({ id: meetings.id })
    .from(meetings)
    .where(eq(meetings.user_id, userId));

  const meetingIds = userMeetings.map((m) => m.id);

  // Delete all imps for these meetings
  for (const mid of meetingIds) {
    await db.delete(imps).where(eq(imps.meeting_id, mid));
  }

  // Delete all meetings
  await db.delete(meetings).where(eq(meetings.user_id, userId));

  // Delete user record in DB
  await db.delete(users).where(eq(users.clerk_id, userId));

  // Delete Clerk identity
  const client = await clerkClient();
  await client.users.deleteUser(userId);
}
