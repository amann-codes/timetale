"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventDropArg, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks } from "@/lib/actions/getTasks";
import { updateTaskTime } from "@/lib/actions/updateTaskTime";
import type { Task } from "@/lib/types";
import { getContrastTextColor, startOfDay, endOfDay, formatDuration } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { CreateTaskSlotModal } from "./create-task-slot-modal";
import { EditTaskModal } from "./edit-task-modal";
import { CalendarTodayButton, CalendarDateNav, CalendarViewSwitch } from "./calendar-header";
import { Button } from "@/components/ui/button";
import { CalendarDays, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STALE_TIME = 60_000;
const MIN_GAP_MINUTES = 15;

/** Escape for use in HTML title attribute (tooltip). */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function CalendarView({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const calendarRef = useRef<FullCalendar>(null);
  const [range, setRange] = useState<{ from: Date; to: Date } | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  const [currentView, setCurrentView] = useState("timeGridWeek");
  const [createSlot, setCreateSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const from = range?.from ?? (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const to = range?.to ?? (() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    d.setDate(d.getDate() + 7);
    return d;
  })();

  const {
    data: tasks = [],
    isPending,
    isError,
    isSuccess,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", userId, from.toISOString(), to.toISOString()],
    queryFn: () => getTasks({ from, to }),
    enabled: !!userId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
  }, [queryClient, userId]);

  const updateMutation = useMutation({
    mutationFn: updateTaskTime,
    onSuccess: () => invalidateTasks(),
  });

  const taskEvents = useMemo(() => {
    const defaultTaskColor = "#dbeafe";
    const defaultTaskBorder = "#93c5fd";
    return tasks.map((task) => {
      const end = new Date(new Date(task.start).getTime() + task.duration * 60000);
      const flair = task.flair;
      const bg = flair?.color ?? defaultTaskColor;
      const border = flair?.color ?? defaultTaskBorder;
      const textColor = flair ? getContrastTextColor(flair.color) : "#1e3a5f";
      return {
        id: task.id,
        title: task.title,
        start: new Date(task.start),
        end,
        backgroundColor: bg,
        borderColor: border,
        extendedProps: {
          description: flair?.description ?? undefined,
          flairName: flair?.name ?? undefined,
          textColor,
        },
      };
    });
  }, [tasks]);

  const gapEvents = useMemo(() => {
    const gaps: Array<{ id: string; start: Date; end: Date; title: string; isGap: true }> = [];
    const dayStart = new Date(from);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(to);
    dayEnd.setHours(23, 59, 59, 999);
    const cursor = new Date(dayStart);
    while (cursor <= dayEnd) {
      const dStart = startOfDay(new Date(cursor));
      const dEnd = endOfDay(new Date(cursor));
      const onDay = taskEvents.filter(
        (e) => e.end > dStart && e.start < dEnd
      );
      const sorted = [...onDay].sort((a, b) => a.start.getTime() - b.start.getTime());
      for (let i = 0; i < sorted.length - 1; i++) {
        const gapStart = sorted[i].end.getTime();
        const gapEnd = sorted[i + 1].start.getTime();
        const gapMinutes = (gapEnd - gapStart) / (60 * 1000);
        if (gapMinutes >= MIN_GAP_MINUTES) {
          gaps.push({
            id: `gap-${cursor.getTime()}-${i}`,
            start: new Date(gapStart),
            end: new Date(gapEnd),
            title: `${formatDuration(gapMinutes)} - gap`,
            isGap: true,
          });
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return gaps;
  }, [from, to, taskEvents]);

  const events = useMemo(() => {
    if (currentView !== "dayGridWeek") {
      return taskEvents;
    }
    const gapAsFc = gapEvents.map((g) => ({
      id: g.id,
      start: g.start,
      end: g.end,
      title: g.title,
      editable: false,
      display: "block" as const,
      classNames: ["fc-gap-event"],
      backgroundColor: "#f3f4f6",
      borderColor: "#9ca3af",
      extendedProps: { isGap: true },
    }));
    return [...taskEvents, ...gapAsFc];
  }, [taskEvents, gapEvents, currentView]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ from: arg.start, to: arg.end });
    setDateLabel(arg.view.title);
    setCurrentView(arg.view.type);
  }, []);

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const newStart = info.event.start!;
      const newEnd = info.event.end!;
      const durationMinutes = (newEnd.getTime() - newStart.getTime()) / 60000;
      updateMutation.mutate(
        {
          id: info.event.id!,
          start: newStart,
          duration: durationMinutes,
        },
        {
          onError: (err) => {
            info.revert();
            toast.error(getFriendlyErrorMessage(err));
          },
        }
      );
    },
    [updateMutation]
  );

  const handleEventResize = useCallback(
    (info: EventResizeDoneArg) => {
      const newStart = info.event.start!;
      const newEnd = info.event.end!;
      const durationMinutes = (newEnd.getTime() - newStart.getTime()) / 60000;
      updateMutation.mutate(
        {
          id: info.event.id!,
          start: newStart,
          duration: durationMinutes,
        },
        {
          onError: (err) => {
            info.revert();
            toast.error(getFriendlyErrorMessage(err));
          },
        }
      );
    },
    [updateMutation]
  );

  const handleSelect = useCallback((info: DateSelectArg) => {
    let start = info.start;
    let end = info.end;
    const durationMs = end.getTime() - start.getTime();
    const fullDayMs = 23 * 60 * 60 * 1000;
    if (durationMs >= fullDayMs) {
      start = startOfDay(start);
      start.setHours(9, 0, 0, 0);
      end = new Date(start.getTime() + 30 * 60 * 1000);
    }
    setCreateSlot({ start, end });
  }, []);

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      info.jsEvent.preventDefault();
      if (info.event.extendedProps?.isGap) {
        const start = info.event.start!;
        const end = info.event.end!;
        setCreateSlot({ start, end });
        return;
      }
      const task = tasks.find((t) => t.id === info.event.id) ?? null;
      setEditTask(task);
    },
    [tasks]
  );

  const goToday = useCallback(() => {
    calendarRef.current?.getApi().today();
  }, []);
  const goPrev = useCallback(() => {
    calendarRef.current?.getApi().prev();
  }, []);
  const goNext = useCallback(() => {
    calendarRef.current?.getApi().next();
  }, []);
  const changeView = useCallback((viewId: string) => {
    calendarRef.current?.getApi().changeView(viewId);
  }, []);

  const eventContent = useCallback(
    (arg: {
      event: {
        title: string;
        start: Date;
        end: Date;
        extendedProps?: { description?: string; flairName?: string; textColor?: string };
      };
    }) => {
      const { title, extendedProps } = arg.event;
      const desc = extendedProps?.description ?? "";
      const flairName = extendedProps?.flairName ?? "";
      const textColor = extendedProps?.textColor;
      const tooltip = [title, flairName, desc].filter(Boolean).join(" · ");
      const style = textColor ? ` style="color: ${escapeAttr(textColor)}"` : "";
      return {
        html: `<div class="fc-event-title fc-sticky" title="${escapeAttr(tooltip)}"${style}>${escapeAttr(title)}${flairName ? ` <span class="fc-event-flair">${escapeAttr(flairName)}</span>` : ""}</div>`,
      };
    },
    []
  );

  const MINUTES_PER_DAY = 24 * 60;
  const AGENDA_DAY_HEIGHT_PX = 480;

  const eventDidMount = useCallback(
    (arg: {
      el: HTMLElement;
      event: {
        start: Date | null;
        end: Date | null;
        backgroundColor?: string;
        borderColor?: string;
        extendedProps?: { isGap?: boolean };
      };
      view: { type: string };
    }) => {
      if (arg.view.type !== "dayGridWeek") return;
      const isGap = arg.event.extendedProps?.isGap;
      if (!isGap && arg.event.backgroundColor) {
        arg.el.style.backgroundColor = arg.event.backgroundColor;
        arg.el.style.borderColor = arg.event.borderColor ?? arg.event.backgroundColor;
      }
      const start = arg.event.start;
      const end = arg.event.end;
      if (!start || !end) return;
      const durationMinutes = (end.getTime() - start.getTime()) / (60 * 1000);
      const heightPx = Math.max(24, (durationMinutes / MINUTES_PER_DAY) * AGENDA_DAY_HEIGHT_PX);
      arg.el.style.minHeight = `${heightPx}px`;
      arg.el.style.display = "flex";
      arg.el.style.alignItems = "center";
      arg.el.style.opacity = "1";
      arg.el.style.visibility = "visible";
    },
    []
  );

  return (
    <>
      {isError && (
        <div className="h-full min-h-[500px] flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
          </div>
          <p className="text-sm text-foreground max-w-sm">
            {getFriendlyErrorMessage(error)}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isError && (
        <div className="h-full min-h-[500px] fc-wrapper flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between gap-4 border border-border rounded-md px-3 py-2 mb-3">
            <CalendarTodayButton onClick={goToday} />
            <CalendarDateNav
              dateLabel={dateLabel}
              onPrev={goPrev}
              onNext={goNext}
            />
            <CalendarViewSwitch
              currentView={currentView}
              onViewChange={changeView}
            />
          </div>
          {tasks.length === 0 && isSuccess && (
            <div className="flex-shrink-0 rounded-lg bg-muted/80 border border-border px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <CalendarDays className="h-4 w-4 flex-shrink-0" aria-hidden />
              <span>No tasks in this range. Click a time slot on the grid below to add one, or use the panel on the right.</span>
            </div>
          )}
          <div className="flex-1 min-h-0 relative">
            {isPending && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-background/80"
                aria-hidden
              >
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              editable
              selectable
              selectMirror
              dayMaxEvents={false}
              weekends
              events={events}
              eventContent={eventContent}
              eventDidMount={eventDidMount}
              height="100%"
              datesSet={handleDatesSet}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              select={handleSelect}
              eventClick={handleEventClick}
            />
          </div>
        </div>
      )}

      {createSlot && (
        <CreateTaskSlotModal
          start={createSlot.start}
          end={createSlot.end}
          onClose={() => setCreateSlot(null)}
          onSuccess={() => {
            setCreateSlot(null);
            invalidateTasks();
          }}
        />
      )}
      {editTask && (
        <EditTaskModal
          taskId={editTask.id}
          task={editTask}
          onClose={() => setEditTask(null)}
          onSuccess={() => {
            setEditTask(null);
            invalidateTasks();
          }}
        />
      )}
    </>
  );
}
