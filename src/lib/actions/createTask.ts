"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { generateTasksFromPrompt } from "../gemini/generateSchedule";
import { validateTasks, resolveConflicts, type TaskSlot } from "@/lib/domain/tasks";
import { getEndTimeMinutes } from "@/lib/utils";
import { insertTasks } from "./insertTasks";

export type CreateTaskFromAIParams = {
  description: string;
  flairIds?: string[];
};

export async function createTaskFromAI({
  description,
  flairIds,
}: CreateTaskFromAIParams): Promise<{ count: number; conflictCount: number }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required. Please sign in.");

  const aiStart = Date.now();
  const result = await generateTasksFromPrompt(description, flairIds);
  const aiLatencyMs = Date.now() - aiStart;
  console.info("[tasks] generateTasksFromPrompt", { latencyMs: aiLatencyMs });

  if (!result || "error" in result) {
    throw new Error(
      typeof result?.error === "string" ? result.error : "The AI failed to generate tasks."
    );
  }

  const newSlots: TaskSlot[] = result.map((t) => ({
    title: t.title,
    start: new Date(t.dateTime),
    duration: Math.max(1, Math.round(t.duration)),
    flairId: t.flairId ?? null,
  }));

  const validation = validateTasks(newSlots);
  if (!validation.valid) throw new Error(validation.error);

  if (newSlots.length === 0) return { count: 0, conflictCount: 0 };

  const minStart = new Date(
    Math.min(...newSlots.map((s) => new Date(s.start).getTime()))
  );
  const maxEnd = new Date(
    Math.max(
      ...newSlots.map((s) =>
        getEndTimeMinutes(new Date(s.start), s.duration).getTime()
      )
    )
  );
  const rangeEnd = new Date(maxEnd);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  const mergeStart = Date.now();
  const existingRows = await prisma.task.findMany({
    where: {
      userId,
      start: { gte: minStart, lt: rangeEnd },
    },
    orderBy: { start: "asc" },
  });
  const existing: TaskSlot[] = existingRows.map((t: { title: string; start: Date; duration: number; flairId: string | null }) => ({
    title: t.title,
    start: t.start,
    duration: t.duration,
    flairId: t.flairId,
  }));

  const { placed, conflictCount } = resolveConflicts(existing, newSlots);
  const mergeTimeMs = Date.now() - mergeStart;
  console.info("[tasks] mergeAndResolve", {
    existingCount: existing.length,
    newCount: newSlots.length,
    placedCount: placed.length,
    conflictCount,
    mergeTimeMs,
  });

  await insertTasks(placed);
  return { count: placed.length, conflictCount };
}
