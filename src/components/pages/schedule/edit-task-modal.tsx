"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateTask } from "@/lib/actions/updateTask";
import { deleteTask } from "@/lib/actions/deleteTask";
import { getUserFlairs } from "@/lib/actions/getUserFlairs";
import { Task } from "@/lib/types";
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

interface EditTaskModalProps {
  taskId: string;
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTaskModal({
  taskId,
  task,
  onClose,
  onSuccess,
}: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [flairId, setFlairId] = useState<string>("__none__");

  const { data: flairs = [] } = useQuery({
    queryKey: ["flairs"],
    queryFn: getUserFlairs,
  });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDuration(task.duration);
      setFlairId(task.flairId ?? "__none__");
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      toast.success("Task updated.");
      onSuccess();
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Task deleted.");
      onSuccess();
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) return;
    updateMutation.mutate({
      id: taskId,
      title: title.trim(),
      duration: Math.max(1, Math.round(duration)),
      flairId: flairId && flairId !== "__none__" ? flairId : null,
    });
  };

  const handleDelete = () => {
    if (!task) return;
    deleteMutation.mutate(taskId);
  };

  const handleClose = () => {
    if (!updateMutation.isPending && !deleteMutation.isPending) onClose();
  };

  if (!task) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="edit-duration">Duration (minutes)</Label>
            <Input
              id="edit-duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 30)}
              className="mt-1"
            />
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
          <p className="text-sm text-muted-foreground">
            Start:{" "}
            {new Date(task.start).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!title.trim() || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
