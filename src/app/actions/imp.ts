"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { imps } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateImp(impId: number, description: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (!description.trim()) throw new Error("Description cannot be empty");

  await db
    .update(imps)
    .set({ description: description.trim() })
    .where(eq(imps.id, impId));

  revalidatePath("/dashboard/meetings");
}

export async function deleteImp(impId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(imps).where(eq(imps.id, impId));

  revalidatePath("/dashboard/meetings");
}
