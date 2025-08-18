"use client"

import { TaskInput } from "./task-input";
import { FlairCreator } from "./flair-input";
import { ScheduleTimeline } from "./timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ScheduleDOC, Flair } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { getContrastTextColor } from "@/lib/utils";
import { FlairList } from "./flairlist";


export default function TaskScheduler() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const createSchedule = useMutation({
    mutationFn: async ({ userId, description, flairIds }: { userId?: string; description: string, flairIds?: string[] }) => {
      const response = await fetch(`${process.env.BACKEND_URL}/api/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, description, flairIds }),
      });
      return response.json();
    },
    onSuccess: (newSchedule) => {
      queryClient.setQueryData(["schedule", userId], (old: ScheduleDOC[] = []) => [...old, newSchedule]);
    },
  });

  const getSchedule = useQuery({
    queryKey: ["schedule", userId],
    queryFn: async ({ queryKey }): Promise<ScheduleDOC> => {
      const [_, userId] = queryKey;
      const res = await fetch(`${process.env.BACKEND_URL}/api/schedule?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return new Promise((resolve) => {
        setTimeout(async () => { resolve(await res.json()) }, 8000)
      })
    },
    enabled: !!userId,
  });

  const createFlair = useMutation({
    mutationFn: async ({ userId, name, description, color }: { userId?: string; name: String; description: string; color: string }) => {
      console.log("UserId before POST request at create flair", userId)
      const response = await fetch(`${process.env.BACKEND_URL}/api/flairs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, description, color }),
      });
      return response.json();
    },
    onSuccess: (newFlair) => {
      queryClient.setQueryData(["flair", userId], (old: Flair[] = []) => [...old, newFlair]);
    },
  });

  const getFlairs = useQuery({
    queryKey: ["flairs", userId],
    queryFn: async ({ queryKey }): Promise<Flair[]> => {
      const [_, userId] = queryKey;
      const res = await fetch(`${process.env.BACKEND_URL}/api/flairs?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return new Promise((resolve) => {
        setTimeout(async () => { resolve(await res.json()) }, 8000)
      })
    },
    enabled: !!userId,
  });

  const patchFlair = useMutation({
    mutationFn: async ({ id, name, description, color }: { id?: string; name: string; description: string; color: string }) => {
      const response = await fetch(`${process.env.BACKEND_URL}/api/flairs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, description, color }),
      });
      return response.json();
    },
    onSuccess: (newFlair) => {
      queryClient.setQueryData(["udpatedFlair", userId], (old: Flair[] = []) => [...old, newFlair]);
    },
  });

  const addTask = (description: string, flairIds?: string[]) => {
    createSchedule.mutate({ userId: session?.user?.id, description, flairIds });
  };

  const addFlair = (name: string, description: string, color: string) => {
    createFlair.mutate({ userId: session?.user?.id, name, description, color })
  }

  const updateFlair = (id: string, name: string, description: string, color: string) => {
    patchFlair.mutate({ id, name, description, color })
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          defaultSize={35}
          minSize={30}
          className="h-full bg-gray-50 p-6 border-r border-gray-200"
        >
          <div className="h-full">
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-gray-900">Task Scheduler</h1>
              <p className="text-gray-600 mt-1 text-sm">Organize your day</p>
            </div>
            <div className="space-y-4">
              <TaskInput onAddTask={addTask}
                disable={!(getFlairs.data && getSchedule.data)}
                flairs={getFlairs.data || []}
              />

              {
                getFlairs.data && <FlairList onUpdateFlair={updateFlair} flairs={getFlairs.data} />
              }

              <FlairCreator onAddFlair={addFlair} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="bg-gray-300 hover:bg-gray-400" />

        <ResizablePanel defaultSize={65} className="h-full p-3">
          <div className="overflow-y-auto px-6 h-full">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 m-0 p-0">Your Schedule</h2>
              <p className="text-gray-600 my-2">All your upcoming tasks and events</p>
            </div>
            {
              getSchedule.isLoading && <div className="h-screen flex items-center justify-center">Loading schedules...</div>
            }
            {
              getSchedule.data?.schedule && <ScheduleTimeline schedule={getSchedule.data.schedule} />
            }
            {
              getSchedule.isError && <div className="h-screen flex items-center justify-center">Error loading schedules: {getSchedule.error?.message}</div>
            }
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}