"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarTodayButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      Today
    </Button>
  );
}

interface CalendarDateNavProps {
  dateLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

export function CalendarDateNav({ dateLabel, onPrev, onNext }: CalendarDateNavProps) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onPrev} aria-label="Previous">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[10rem] text-center text-sm font-medium tabular-nums">
        {dateLabel}
      </span>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onNext} aria-label="Next">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

const VIEWS = [
  { id: "timeGridDay", label: "Day" },
  { id: "timeGridWeek", label: "Week" },
  { id: "dayGridWeek", label: "Agenda" },
] as const;

interface CalendarViewSwitchProps {
  currentView: string;
  onViewChange: (viewId: string) => void;
}

export function CalendarViewSwitch({ currentView, onViewChange }: CalendarViewSwitchProps) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onViewChange(v.id)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors",
            currentView === v.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
