"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { createTaskManual } from "@/lib/actions/createTaskManual";
import { getUserFlairs } from "@/lib/actions/getUserFlairs";
import { getFriendlyErrorMessage } from "@/lib/errors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlairPicker } from "./flair-picker";

interface CreateTaskSlotModalProps {
  start: Date;
  end: Date;
  onClose: () => void;
  onSuccess: () => void;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function toTimeString(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function CreateTaskSlotModal({
  start,
  end,
  onClose,
  onSuccess,
}: CreateTaskSlotModalProps) {
  const initialDuration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const [title, setTitle] = useState("");
  const [flairId, setFlairId] = useState<string>("__none__");
  const [date, setDate] = useState(() => toDateString(start));
  const [time, setTime] = useState(() => toTimeString(start));
  const [duration, setDuration] = useState(initialDuration);

  const { data: flairs = [] } = useQuery({
    queryKey: ["flairs"],
    queryFn: getUserFlairs,
  });

  const createMutation = useMutation({
    mutationFn: createTaskManual,
    onSuccess: () => {
      toast.success("Task added.");
      onSuccess();
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const [hours, minutes] = time.split(":").map(Number);
    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);
    createMutation.mutate({
      title: title.trim(),
      start: startDate,
      duration: Math.max(1, Math.round(duration)),
      flairId: flairId && flairId !== "__none__" ? flairId : null,
    });
  };

  const handleClose = () => {
    if (!createMutation.isPending) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="create-title">Title</Label>
            <Input
              id="create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="mt-1"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="create-date">Date</Label>
              <Input
                id="create-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="create-time">Time</Label>
              <Input
                id="create-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="create-duration">Duration (min)</Label>
              <Input
                id="create-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 30)}
                className="mt-1"
              />
            </div>
          </div>
          {flairs.length > 0 && (
            <div>
              <Label>Flair</Label>
              <FlairPicker
                flairs={flairs}
                value={flairId || "__none__"}
                onChange={setFlairId}
                showDescription
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
