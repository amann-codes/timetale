"use client";

import { Button } from "@/components/ui/button";
import { ScheduleGET as Schedule } from "@/lib/types";

interface TaskItemProps {
  task: Schedule;
}

export function TaskItem({ task }: TaskItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{task.title}</p>
        <p className="text-xs text-gray-500">{task.constraint}</p>
        <p className="text-xs text-gray-500">
          {task.dateTime} • {task.duration}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => alert(`Edit task: ${task.title}`)}
      >
        Edit
      </Button>
    </div>
  );
}
