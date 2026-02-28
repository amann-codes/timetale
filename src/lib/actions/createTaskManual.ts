"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { Task } from "@/lib/types";

export type CreateTaskManualParams = {
  title: string;
  start: Date;
  duration: number;
  flairId?: string | null;
};

export async function createTaskManual({
  title,
  start,
  duration,
  flairId,
}: CreateTaskManualParams): Promise<Task> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required.");
  if (!title?.trim()) throw new Error("Title is required.");
  if (typeof duration !== "number" || duration < 1) throw new Error("Duration must be a positive number of minutes.");
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) throw new Error("Invalid start time.");

  const created = await prisma.task.create({
    data: {
      userId,
      title: title.trim(),
      start: startDate,
      duration: Math.round(duration),
      flairId: flairId ?? null,
    },
  });
  return {
    id: created.id,
    title: created.title,
    start: created.start,
    duration: created.duration,
    flairId: created.flairId,
  };
}
