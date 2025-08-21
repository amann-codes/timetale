"use client"

import { TaskInput } from "./task-input";
import { FlairCreator } from "./flair-input";
import { ScheduleTimeline } from "./timeline";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ScheduleDOC, Flair } from "@/lib/types";
import { FlairList } from "./flairlist";
import { getSchedule } from "@/lib/actions/getSchedule";
import { getUserFlairs } from "@/lib/actions/getUserFlairs";
import { createFlair } from "@/lib/actions/createflair";
import { createTask } from "@/lib/actions/createTask";
import { patchFlair } from "@/lib/actions/patchflair";
import { UserButton } from "../layout/user-button";
import { toast } from 'sonner';

export default function TaskScheduler() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async ({ userId, description, flairIds }: { userId?: string; description: string, flairIds?: string[] }) => {
      const response = await createTask({ userId, description, flairIds });
      return response.json();
    },
    onSuccess: (newSchedule) => {
      queryClient.setQueryData(["schedule", userId], (old: ScheduleDOC[] = []) => [...old, newSchedule]);
    },
  });

  const getScheduleQuery = useQuery({
    queryKey: ["schedule", userId],
    queryFn: async ({ queryKey }): Promise<ScheduleDOC> => {
      const [_, userId] = queryKey;
      const res = await getSchedule(userId);
      return res;
    },
    enabled: !!userId,
  });

  const createFlairMutation = useMutation({
    mutationFn: async ({ userId, name, description, color }: { userId?: string; name: String; description: string; color: string }) => {
      const res = await createFlair({ userId, name, description, color });
      return res;
    },
    onSuccess: (newFlair) => {
      queryClient.setQueryData(["flair", userId], (old: Flair[] = []) => [...old, newFlair]);
    },
  });

  const getFlairsQuery = useQuery({
    queryKey: ["flairs", userId],
    queryFn: async ({ queryKey }): Promise<Flair[]> => {
      const [_, userId] = queryKey;
      const res = await getUserFlairs(userId);
      return res;
    },
    enabled: !!userId,
  });

  const patchFlairMutation = useMutation({
    mutationFn: async ({ id, name, description, color }: { id?: string; name: string; description: string; color: string }) => {
      const response = await patchFlair({ id, name, description, color })
      return response.json();
    },
    onSuccess: (newFlair) => {
      queryClient.setQueryData(["udpatedFlair", userId], (old: Flair[] = []) => [...old, newFlair]);
    },
  });

  const addTask = (description: string, flairIds?: string[]) => {
    createTaskMutation.mutate({ userId: session?.user?.id, description, flairIds });
  };

  const addFlair = (name: string, description: string, color: string) => {
    createFlairMutation.mutate({ userId: session?.user?.id, name, description, color })
  }

  const updateFlair = (id: string, name: string, description: string, color: string) => {
    patchFlairMutation.mutate({ id, name, description, color })
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={65} className="h-full p-3">
          <div className="overflow-y-auto px-6 h-full">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 m-0 p-0">Your Schedule</h2>
              <p className="text-gray-600 my-2">All your upcoming tasks and events</p>
            </div>
            {
              getScheduleQuery.isLoading && (
                <div className="h-96 flex items-center justify-center">Loading schedules...</div>
              )
            }
            {
              getScheduleQuery.isError && (
                <div className="h-24 items-center justify-center">
                  Error loading schedules: {getScheduleQuery.error?.message}
                </div>
              )
            }
            {
              (
                getScheduleQuery.isSuccess && getScheduleQuery.data?.schedule?.length > 0) ? (
                <ScheduleTimeline schedule={getScheduleQuery.data.schedule} />
              ) : (
                getScheduleQuery.isFetched &&
                < div className="flex items-center justify-center h-96">
                  <p className="text-gray-600">No schedule for today, create one!</p>
                </div>
              )
            }
          </div>
        </ResizablePanel>
        <ResizableHandle className="bg-gray-300 hover:bg-gray-400" />
        <ResizablePanel
          defaultSize={35}
          minSize={30}
          className="h-full bg-gray-50 p-6 border-r border-gray-200"
        >
          <div className="h-full">
            <div className="flex justify-between">
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-gray-900">Task Scheduler</h1>
                <p className="text-gray-600 mt-1 text-sm">Organize your day</p>
              </div>
              <UserButton />
            </div>
            <div className="space-y-4 h-full">
              <TaskInput
                onAddTask={addTask}
                disable={!(getFlairsQuery.isFetched)}
                flairs={getFlairsQuery.data || []}
              />
              {getFlairsQuery.data && getFlairsQuery?.data?.length != 0 && <FlairList onUpdateFlair={updateFlair} flairs={getFlairsQuery.data} />}
              <FlairCreator onAddFlair={addFlair} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div >
  );
}