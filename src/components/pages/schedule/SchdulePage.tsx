"use client";

import CalendarView from "./calendar-view";
import { SchedulePanel } from "./schedule-panel";
import { useSession } from "next-auth/react";
import { UserButton } from "../layout/user-button";

export default function TaskScheduler() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="h-full grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border flex-shrink-0">
            <h2 className="text-xl font-bold text-foreground m-0">Your Schedule</h2>
            <UserButton />
          </div>
          <div className="flex-1 min-h-0 p-4">
            {userId ? (
              <CalendarView userId={userId} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Sign in to view your calendar.
              </div>
            )}
          </div>
        </div>
        <div className="h-full flex flex-col border-t lg:border-t-0 lg:border-l border-border p-4 min-h-0">
          <SchedulePanel />
        </div>
      </div>
    </div>
  );
}
