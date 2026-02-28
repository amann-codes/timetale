"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import type { TaskSlot } from "@/lib/domain/tasks";

export async function insertTasks(tasks: TaskSlot[]): Promise<{ count: number }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");
  if (tasks.length === 0) return { count: 0 };
  const startInsert = Date.now();
  await prisma.task.createMany({
    data: tasks.map((t) => ({
      userId,
      title: t.title,
      start: t.start,
      duration: t.duration,
      flairId: t.flairId ?? null,
    })),
  });
  const elapsed = Date.now() - startInsert;
  console.info("[tasks] insertTasks", { count: tasks.length, userId, elapsedMs: elapsed });
  return { count: tasks.length };
}
