"use client";

import { useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScheduleGET } from "@/lib/types";
import { AddTaskForm } from "./AddTaskForm";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type GroupedTasks = {
  [date: string]: ScheduleGET[];
};

export default function SchedulePage() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ['schedule', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const response = await fetch(`/api/schedule?userId=${session.user.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data?.schedule || [];
    },
    enabled: !!session?.user?.id,
  });

  const groupedTasks = useMemo(() => {
    return (data || []).reduce((acc: GroupedTasks, task: ScheduleGET) => {
      const date = new Date(task.dateTime).toISOString().split("T")[0]; // 'YYYY-MM-DD'
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {});
  }, [data]);

  const uniqueDates = Object.keys(groupedTasks);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Your Schedule
            </CardTitle>
            <p className="text-center text-gray-500">Loading tasks...</p>
          </CardHeader>
          <CardContent>
            <AddTaskForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Your Schedule
            </CardTitle>
            <p className="text-center text-red-500">Error fetching tasks: {error.message}</p>
          </CardHeader>
          <CardContent>
            <AddTaskForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Your Schedule
            </CardTitle>
            <p className="text-center text-gray-500">No tasks scheduled yet.</p>
          </CardHeader>
          <CardContent>
            <AddTaskForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Your Schedule
            </CardTitle>
            <Tabs defaultValue={uniqueDates[0]} className="mt-4">
              <TabsList className="flex justify-center flex-wrap bg-gray-200 p-1 rounded mx-auto">
                {uniqueDates.map((date) => (
                  <TabsTrigger key={date} value={date} className="p-2">
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </TabsTrigger>
                ))}
              </TabsList>
              {uniqueDates.map((date, index) => (
                <TabsContent key={index} value={date} className="mt-4">
                  <div className="space-y-2">
                    {groupedTasks[date].map((task: ScheduleGET, index2: number) => (
                      <Card
                        key={index2}
                        className="p-3 bg-white border border-gray-100 rounded-lg"
                      >
                        <div className="flex flex-col space-y-1">
                          <h4 className="text-sm font-medium text-gray-800">
                            {task.title}
                          </h4>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Duration: {task.duration}</span>
                            <span>
                              Time:{" "}
                              {new Date(task.dateTime).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardHeader>
          <CardContent>
            <AddTaskForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}