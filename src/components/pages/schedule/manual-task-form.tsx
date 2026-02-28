"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Flair } from "@/lib/types";
import { Calendar, Clock } from "lucide-react";

const manualTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().min(1, "Duration required").refine((v) => /^\d+$/.test(v) && parseInt(v, 10) >= 1, "At least 1 minute"),
  flairId: z.string().optional(),
});

export type ManualTaskFormValues = z.infer<typeof manualTaskSchema>;

interface ManualTaskFormProps {
  flairs: Flair[];
  defaultDate: string; // YYYY-MM-DD
  onSubmit: (values: { title: string; date: string; time: string; duration: number; flairId?: string }) => void;
  disabled?: boolean;
}

/** Form values: duration is string from input, converted to number on submit. */

export function ManualTaskForm({
  flairs,
  defaultDate,
  onSubmit,
  disabled,
}: ManualTaskFormProps) {
  const form = useForm<ManualTaskFormValues>({
    resolver: zodResolver(manualTaskSchema),
    defaultValues: {
      title: "",
      date: defaultDate,
      time: "09:00",
      duration: "30",
      flairId: "__none__",
    },
  });

  const handleSubmit = (values: ManualTaskFormValues) => {
    const duration = parseInt(values.duration, 10) || 30;
    onSubmit({
      title: values.title,
      date: values.date,
      time: values.time,
      duration,
      flairId: values.flairId && values.flairId !== "__none__" ? values.flairId : undefined,
    });
    form.reset({
      title: "",
      date: defaultDate,
      time: "09:00",
      duration: "30",
      flairId: "__none__",
    });
  };

  return (
    <Card>
      <CardContent>
        <h3 className="font-medium text-foreground">Add task manually</h3>
        <Separator className="w-full my-2 bg-border" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" className="text-sm h-8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" className="text-sm h-8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Time
                    </FormLabel>
                    <FormControl>
                      <Input type="time" className="text-sm h-8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Duration (min)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} className="text-sm h-8" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {flairs.length > 0 && (
              <FormField
                control={form.control}
                name="flairId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Flair</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "__none__"}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {flairs.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button
              type="submit"
              size="sm"
              className="w-full h-8"
              disabled={disabled}
            >
              Add task
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
