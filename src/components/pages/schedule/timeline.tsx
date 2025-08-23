"use client"

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Schedule } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { FlairBadge } from "@/components/pages/schedule/FlairBadge";
import { Suspense } from "react";

export function ScheduleTimeline({ schedule }: { schedule: Schedule[] }) {
    return (
        <div>
            {schedule.map((sched, index) => (
                <Card key={index} className="w-full mx-auto mb-4 shadow-sm rounded-lg">
                    <CardHeader className="px-6">
                        <CardTitle className="flex justify-between text-xl font-semibold text-gray-900">
                            <p>{sched.title}</p>
                            <Suspense fallback={<Badge className="animate-pulse"></Badge>}>
                                {sched.flairId && <FlairBadge id={sched.flairId} />}
                            </Suspense>
                        </CardTitle>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium">{formatDateTime(sched.dateTime)}</span>
                            <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">{sched.duration}</span>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}