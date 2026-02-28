"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { Flair } from "@/lib/types";
import { getContrastTextColor } from "@/lib/utils";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";

const aiSchema = z.object({
  description: z.string().min(1, "Describe what you need to do").or(z.literal("")),
});

const manualSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date required"),
  time: z.string().min(1, "Time required"),
  duration: z.string().min(1, "Duration required").refine((v) => /^\d+$/.test(v) && parseInt(v, 10) >= 1, "Min 1"),
  flairId: z.string().optional(),
});

type ManualValues = z.infer<typeof manualSchema>;

interface UnifiedTaskAddProps {
  flairs: Flair[];
  defaultDate: string;
  disabled?: boolean;
  onAddAI: (description: string, flairIds?: string[]) => void;
  onAddManual: (v: { title: string; date: string; time: string; duration: number; flairId?: string }) => void;
}

export function UnifiedTaskAdd({
  flairs,
  defaultDate,
  disabled,
  onAddAI,
  onAddManual,
}: UnifiedTaskAddProps) {
  const [useAI, setUseAI] = useState(true);
  const [selectedFlairs, setSelectedFlairs] = useState<Flair[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const manualForm = useForm<ManualValues>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      title: "",
      date: defaultDate,
      time: "09:00",
      duration: "30",
      flairId: "__none__",
    },
  });

  useEffect(() => {
    if (useAI) descRef.current?.focus();
    else titleRef.current?.focus();
  }, [useAI]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      manualForm.reset({ title: "", date: defaultDate, time: "09:00", duration: "30", flairId: "__none__" });
      setSelectedFlairs([]);
    }
  };

  const duration = manualForm.watch("duration");
  const durationNum = parseInt(duration, 10) || 30;
  const setDuration = (n: number) => manualForm.setValue("duration", String(Math.max(1, n)));

  const onAISubmit = (data: z.infer<typeof aiSchema>) => {
    if (!data.description?.trim() && selectedFlairs.length === 0) return;
    onAddAI(data.description?.trim() ?? "", selectedFlairs.length ? selectedFlairs.map((f) => f.id) : undefined);
    setSelectedFlairs([]);
  };

  const onManualSubmit = (values: ManualValues) => {
    const durationN = parseInt(values.duration, 10) || 30;
    onAddManual({
      title: values.title,
      date: values.date,
      time: values.time,
      duration: durationN,
      flairId: values.flairId && values.flairId !== "__none__" ? values.flairId : undefined,
    });
    manualForm.reset({ title: "", date: defaultDate, time: "09:00", duration: "30", flairId: "" });
  };

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="use-ai"
          checked={useAI}
          onChange={(e) => setUseAI(e.target.checked)}
          className="rounded border-border"
        />
        <Label htmlFor="use-ai" className="text-base font-medium cursor-pointer">
          Use AI parsing
        </Label>
      </div>

      {useAI ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const desc = (e.currentTarget.elements.namedItem("description") as HTMLTextAreaElement)?.value ?? "";
            if (desc.trim() || selectedFlairs.length > 0) {
              onAddAI(desc.trim(), selectedFlairs.length ? selectedFlairs.map((f) => f.id) : undefined);
              setSelectedFlairs([]);
              (e.target as HTMLFormElement).reset();
            }
          }}
          className="space-y-3"
        >
          {flairs.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Flairs (optional)</Label>
              <div className="flex flex-wrap gap-1.5">
                {flairs
                  .filter((f) => !selectedFlairs.some((s) => s.id === f.id))
                  .map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFlairs((p) => [...p, f])}
                      disabled={disabled}
                      className="rounded-md border border-border px-2.5 py-1 text-sm hover:bg-muted"
                    >
                      {f.name}
                    </button>
                  ))}
                {selectedFlairs.map((f) => (
                  <Badge
                    key={f.id}
                    style={{ backgroundColor: f.color, color: getContrastTextColor(f.color), border: "none" }}
                    className="text-sm gap-0.5 pr-0.5"
                  >
                    {f.name}
                    <button
                      type="button"
                      onClick={() => setSelectedFlairs((p) => p.filter((x) => x.id !== f.id))}
                      className="rounded p-0.5 hover:bg-black/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm text-muted-foreground">
              What do you need to do?
            </Label>
            <Textarea
              id="description"
              name="description"
              ref={descRef}
              placeholder="e.g. Team standup at 10am, review PRs after lunch"
              className="min-h-[80px] resize-none text-base border-border"
              disabled={disabled}
            />
          </div>
          <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={disabled}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add tasks
          </Button>
        </form>
      ) : (
        <Form {...manualForm}>
          <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-3">
            <FormField
              control={manualForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Task title"
                      className="h-9 text-base border-border"
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        (titleRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={manualForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-9 text-base border-border" {...field} />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={manualForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Time</FormLabel>
                    <FormControl>
                      <Input type="time" className="h-9 text-base border-border" {...field} />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={manualForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Min</FormLabel>
                    <div className="flex h-9 items-center gap-0.5 border border-border rounded-md overflow-hidden">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-7 shrink-0 rounded-none"
                        onClick={() => setDuration(durationNum - 15)}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="h-9 w-12 border-0 rounded-none text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-7 shrink-0 rounded-none"
                        onClick={() => setDuration(durationNum + 15)}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />
            </div>
            {flairs.length > 0 && (
              <FormField
                control={manualForm.control}
                name="flairId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Flair</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "__none__"} disabled={disabled}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-base border-border">
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
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={disabled}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add task
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
