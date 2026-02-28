"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Flair } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedTaskAdd } from "./unified-task-add";
import { FlairList } from "./flairlist";
import { FlairCreator } from "./flair-input";
import { getUserFlairs } from "@/lib/actions/getUserFlairs";
import { createFlair } from "@/lib/actions/createflair";
import { createTaskFromAI } from "@/lib/actions/createTask";
import { createTaskManual } from "@/lib/actions/createTaskManual";
import { patchFlair } from "@/lib/actions/patchflair";
import { getTasks } from "@/lib/actions/getTasks";
import { startOfDay, endOfDay } from "@/lib/utils";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function SchedulePanel() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const invalidateTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks", userId] });
  }, [queryClient, userId]);

  const todayTasksQuery = useQuery({
    queryKey: ["tasks", userId, "today", todayStart.toISOString(), todayEnd.toISOString()],
    queryFn: () => getTasks({ from: todayStart, to: todayEnd }),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const todayStats =
    todayTasksQuery.data?.length != null
      ? {
          count: todayTasksQuery.data.length,
          minutes: todayTasksQuery.data.reduce((sum, t) => sum + t.duration, 0),
        }
      : null;

  const createTaskFromAIMutation = useMutation({
    mutationFn: createTaskFromAI,
    onSuccess: (data) => {
      toast.success(data.count > 0 ? `Added ${data.count} task${data.count !== 1 ? "s" : ""}.` : "Done.");
      invalidateTasks();
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  const createTaskManualMutation = useMutation({
    mutationFn: createTaskManual,
    onSuccess: () => {
      toast.success("Task added.");
      invalidateTasks();
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  const createFlairMutation = useMutation({
    mutationFn: createFlair,
    onSuccess: () => {
      toast.success("Flair created.");
      queryClient.invalidateQueries({ queryKey: ["flairs"] });
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  const getFlairsQuery = useQuery({
    queryKey: ["flairs"],
    queryFn: getUserFlairs,
    enabled: !!userId,
  });

  const patchFlairMutation = useMutation({
    mutationFn: patchFlair,
    onSuccess: () => {
      toast.success("Flair updated.");
      queryClient.invalidateQueries({ queryKey: ["flairs"] });
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  });

  const addTaskAI = (description: string, flairIds?: string[]) => {
    createTaskFromAIMutation.mutate({ description, flairIds });
  };

  const addTaskManual = (v: { title: string; date: string; time: string; duration: number; flairId?: string }) => {
    const [hours, minutes] = v.time.split(":").map(Number);
    const start = new Date(v.date);
    start.setHours(hours, minutes, 0, 0);
    createTaskManualMutation.mutate({
      title: v.title,
      start,
      duration: v.duration,
      flairId: v.flairId ?? null,
    });
  };

  const flairs = getFlairsQuery.data ?? [];
  const isLoading = getFlairsQuery.isPending;
  const isError = getFlairsQuery.isError;

  const contextLine =
    todayStats != null
      ? `Today · ${todayStats.count} task${todayStats.count !== 1 ? "s" : ""} · ${formatDuration(todayStats.minutes)} scheduled`
      : "Today";

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-base font-semibold text-foreground">Task Scheduler</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{contextLine}</p>
      </div>

      <Tabs defaultValue="add" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border h-10 bg-muted/50 text-sm">
          <TabsTrigger value="add" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background text-sm">
            Add
          </TabsTrigger>
          <TabsTrigger value="flairs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background text-sm">
            Flairs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="flex-1 mt-0 p-4 overflow-y-auto min-h-0">
          {isLoading && (
            <div className="flex items-center gap-2 text-base text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading…</span>
            </div>
          )}
          {isError && (
            <div className="rounded-md border border-border bg-destructive/5 p-3 flex flex-col gap-2 mb-4">
              <p className="text-sm text-foreground">{getFriendlyErrorMessage(getFlairsQuery.error)}</p>
              <Button variant="outline" size="sm" onClick={() => getFlairsQuery.refetch()}>
                Try again
              </Button>
            </div>
          )}
          {(getFlairsQuery.isSuccess || getFlairsQuery.isFetched) && (
            <UnifiedTaskAdd
              flairs={flairs}
              defaultDate={toYYYYMMDD(todayStart)}
              disabled={isLoading}
              onAddAI={addTaskAI}
              onAddManual={addTaskManual}
            />
          )}
        </TabsContent>

        <TabsContent value="flairs" className="flex-1 mt-0 p-4 overflow-y-auto min-h-0">
          <div className="space-y-4">
            {flairs.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Your flairs</h3>
                <FlairList
                  embedded
                  flairs={flairs}
                  onUpdateFlair={(id, name, desc, color) => patchFlairMutation.mutate({ id, name, description: desc, color })}
                />
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Create flair</h3>
              <FlairCreator
                embedded
                onAddFlair={(name, desc, color) => createFlairMutation.mutate({ name, description: desc, color })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
