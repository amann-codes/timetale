"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { Task } from "@/lib/types";

export type UpdateTaskTimeParams = {
  id: string;
  start: Date;
  duration: number;
};

export async function updateTaskTime({
  id,
  start,
  duration,
}: UpdateTaskTimeParams): Promise<Task> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized.");

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found or access denied.");

  const roundedDuration = Math.max(1, Math.round(duration));
  const updated = await prisma.task.update({
    where: { id },
    data: { start: new Date(start), duration: roundedDuration },
  });
  return {
    id: updated.id,
    title: updated.title,
    start: updated.start,
    duration: updated.duration,
    flairId: updated.flairId,
  };
}
