"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { Task } from "@/lib/types";

export type UpdateTaskParams = {
  id: string;
  title?: string;
  start?: Date;
  duration?: number;
  flairId?: string | null;
};

export async function updateTask({
  id,
  title,
  start,
  duration,
  flairId,
}: UpdateTaskParams): Promise<Task> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found or access denied.");

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(start !== undefined && { start }),
      ...(duration !== undefined && { duration }),
      ...(flairId !== undefined && { flairId }),
    },
  });
  return {
    id: updated.id,
    title: updated.title,
    start: updated.start,
    duration: updated.duration,
    flairId: updated.flairId,
  };
}
