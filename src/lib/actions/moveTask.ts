"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { Task } from "@/lib/types";

export async function moveTask(
  id: string,
  newStart: Date
): Promise<Task> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found or access denied.");

  const updated = await prisma.task.update({
    where: { id },
    data: { start: newStart },
  });
  return {
    id: updated.id,
    title: updated.title,
    start: updated.start,
    duration: updated.duration,
    flairId: updated.flairId,
  };
}
