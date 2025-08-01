"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SchedulePOST } from "@/lib/types";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Define the query key type to match SchedulePage
type QueryKey = readonly [string, string | undefined];

export function AddTaskForm() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (body: SchedulePOST) => {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Task added successfully!");
      if (session?.user?.id) {
        queryClient.invalidateQueries({ queryKey: ['schedule', session.user.id] as QueryKey });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule task: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("You must be logged in to add a task.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const description = formData.get("tasks")?.toString() || "";
    if (!description) {
      toast.error("Task description cannot be empty.");
      return;
    }
    mutation.mutate({ userId: session.user.id, description });
    e.currentTarget.reset(); // Reset the form after submission
  };

  const handleVoiceInput = () => {
    console.log("Starting voice input...");
    toast.info("Voice input not implemented. Type tasks in the textarea.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="tasks">Describe Your Tasks</Label>
        <Textarea
          id="tasks"
          name="tasks"
          placeholder="e.g., Prepare presentation for 2 hours before 3 PM, call client for 30 minutes any time"
          className="mt-3 min-h-[100px]"
          disabled={mutation.isPending || !session?.user?.id}
        />
      </div>
      <div className="flex space-x-2">
        <Button type="submit" className="flex-1" disabled={mutation.isPending || !session?.user?.id}>
          {mutation.isPending ? "Scheduling..." : "Schedule Tasks"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleVoiceInput}
          className="flex-1"
          disabled={mutation.isPending || !session?.user?.id}
        >
          Voice Input
        </Button>
      </div>
    </form>
  );
}