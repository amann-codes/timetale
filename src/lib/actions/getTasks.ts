"use server";

import { auth } from "../auth/auth";
import prisma from "@/lib/db/prisma";
import { Task } from "@/lib/types";

export type GetTasksParams = {
  from: Date;
  to: Date;
};

export async function getTasks({
  from,
  to,
}: GetTasksParams): Promise<Task[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User must sign in to load tasks.");
  }
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      start: {
        gte: from,
        lt: to,
      },
    },
    include: { flair: true },
    orderBy: { start: "asc" },
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    start: t.start,
    duration: t.duration,
    flairId: t.flairId,
    flair: t.flair
      ? { id: t.flair.id, name: t.flair.name, description: t.flair.description, color: t.flair.color }
      : null,
  }));
}
