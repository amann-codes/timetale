"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";

export async function deleteTask(id: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found or access denied.");

  await prisma.task.delete({ where: { id } });
}
