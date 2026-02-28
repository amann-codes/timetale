/**
 * Pure domain logic for tasks. No Prisma, no auth.
 * Used by server actions after auth and before DB.
 */

import { getEndTimeMinutes } from "@/lib/utils";

export type TaskSlot = {
  title: string;
  start: Date;
  duration: number;
  flairId?: string | null;
};

/** Validate: title non-empty, duration positive, start is valid. */
export function validateTasks(tasks: TaskSlot[]): { valid: true } | { valid: false; error: string } {
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    if (!t.title?.trim()) return { valid: false, error: `Task ${i + 1}: title is required` }
    if (typeof t.duration !== "number" || t.duration < 1) return { valid: false, error: `Task ${i + 1}: duration must be a positive number of minutes` }
    const start = new Date(t.start)
    if (Number.isNaN(start.getTime())) return { valid: false, error: `Task ${i + 1}: invalid start time` }
  }
  return { valid: true }
}

/**
 * Resolve conflicts: for each new task, find first gap big enough and insert there.
 * If no gap, push to end of day (same day as task start, 23:00 as default end slot).
 */
export function resolveConflicts(
  existing: TaskSlot[],
  newTasks: TaskSlot[],
  endOfDayHour: number = 23
): { placed: TaskSlot[]; conflictCount: number } {
  const sortedExisting = [...existing].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  let conflictCount = 0
  const placed: TaskSlot[] = []

  for (const task of newTasks) {
    const start = new Date(task.start)
    const duration = Math.max(1, Math.round(task.duration))
    const end = getEndTimeMinutes(start, duration)

    const dayEnd = new Date(start)
    dayEnd.setHours(endOfDayHour, 59, 59, 999)

    const gaps: { start: Date; end: Date }[] = []
    let prevEnd = new Date(start)
    prevEnd.setHours(0, 0, 0, 0)

    for (const e of sortedExisting) {
      const eStart = new Date(e.start)
      const eEnd = getEndTimeMinutes(eStart, e.duration)
      if (eStart.getTime() > prevEnd.getTime()) {
        gaps.push({ start: new Date(prevEnd), end: new Date(eStart) })
      }
      if (eEnd.getTime() > prevEnd.getTime()) prevEnd = eEnd
    }
    if (dayEnd.getTime() > prevEnd.getTime()) {
      gaps.push({ start: new Date(prevEnd), end: new Date(dayEnd) })
    }

    let inserted = false
    for (const gap of gaps) {
      const gapMinutes = (gap.end.getTime() - gap.start.getTime()) / 60000
      if (gapMinutes >= duration) {
        placed.push({
          title: task.title,
          start: new Date(gap.start),
          duration,
          flairId: task.flairId,
        })
        sortedExisting.push({
          title: task.title,
          start: gap.start,
          duration,
          flairId: task.flairId,
        })
        sortedExisting.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        inserted = true
        break
      }
    }
    if (!inserted) {
      conflictCount++
      const pushStart = prevEnd.getTime() > start.getTime() ? prevEnd : start
      placed.push({
        title: task.title,
        start: new Date(pushStart),
        duration,
        flairId: task.flairId,
      })
      sortedExisting.push({
        title: task.title,
        start: pushStart,
        duration,
        flairId: task.flairId,
      })
      sortedExisting.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    }
  }

  return { placed, conflictCount }
}
