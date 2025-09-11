"use client"

import { TaskInput } from "./task-input";
import { FlairCreator } from "./flair-input";
import { ScheduleTimeline } from "./timeline";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScheduleDOC, Flair } from "@/lib/types";
import { FlairList } from "./flairlist";
import { getSchedule } from "@/lib/actions/getSchedule";
import { getUserFlairs } from "@/lib/actions/getUserFlairs";
import { createFlair } from "@/lib/actions/createflair";
import { createTask } from "@/lib/actions/createTask";
import { patchFlair } from "@/lib/actions/patchflair";
import { UserButton } from "../layout/user-button";

export default function TaskScheduler() {
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['schedule'] })
  });

  const getScheduleQuery = useQuery({
    queryKey: ["schedule"],
    queryFn: getSchedule,
  });

  const createFlairMutation = useMutation({
    mutationFn: createFlair,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['flairs'] })
  });

  const getFlairsQuery = useQuery({
    queryKey: ["flairs"],
    queryFn: getUserFlairs
  });

  const patchFlairMutation = useMutation({
    mutationFn: patchFlair,
    onSuccess: (newFlair) => {
      queryClient.setQueryData(["udpatedFlair"], (old: Flair[] = []) => [...old, newFlair]);
    },
  });

  const addTask = (description: string, flairIds?: string[]) => {
    createTaskMutation.mutate({ description, flairIds });
  };

  const addFlair = (name: string, description: string, color: string) => {
    createFlairMutation.mutate({ name, description, color })
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
                getScheduleQuery.isSuccess && getScheduleQuery.data.length > 0) ? (
                <ScheduleTimeline schedule={getScheduleQuery.data} />
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