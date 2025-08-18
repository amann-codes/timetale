"use client"

import type React from "react"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import type { Flair } from "@/lib/types"
import { getContrastTextColor } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface TaskInputProps {
  flairs: Flair[]
  onAddTask: (description: string, flairIds?: string[]) => void
  disable: boolean
}

const taskSchema = z.object({
  description: z
    .string()
    .min(20, "Task description is required")
    .or(z.literal("")),
})

type TaskFormData = z.infer<typeof taskSchema>

export function TaskInput({ flairs, onAddTask, disable }: TaskInputProps) {
  const [selectedFlairs, setSelectedFlairs] = useState<Flair[]>([])

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      description: "",
    },
  })

  const handleFlairToggle = (flair: Flair) => {
    setSelectedFlairs((prev) => {
      const isSelected = prev.some((selected) => selected.id === flair.id)
      if (isSelected) {
        return prev.filter((selected) => selected.id !== flair.id)
      } else {
        return [...prev, flair]
      }
    })
  }

  const handleRemoveFlair = (flairId: string) => {
    setSelectedFlairs((prev) => prev.filter((flair) => flair.id !== flairId))
  }

  const onSubmit = (data: TaskFormData) => {
    if (!data.description?.trim() && selectedFlairs.length === 0) return

    const flairIds = selectedFlairs.map((flair) => flair.id)
    onAddTask(data.description, flairIds.length > 0 ? flairIds : undefined)

    form.reset()
    setSelectedFlairs([])
  }

  return (
    <Card>
      <CardContent>
        <h3 className="font-medium text-gray-900">Add Task</h3>
        <Separator className="w-full my-2 bg-gray-400"/>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {flairs.length > 0 && (
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium text-gray-700">Available Flairs</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {flairs
                    .filter((flair) => !selectedFlairs.some((selected) => selected.id === flair.id))
                    .map((flair) => (
                      <button
                        key={flair.id}
                        type="button"
                        onClick={() => handleFlairToggle(flair)}
                        disabled={disable}
                        className="transition-all duration-200 hover:scale-105 hover:ring-1 hover:ring-gray-300"
                      >
                        <Badge
                          style={{
                            border: `1px solid ${flair.color}`,
                            backgroundColor: "transparent",
                            color: flair.color,
                          }}
                          className="cursor-pointer text-sm transition-colors duration-200 hover:bg-gray-50"
                        >
                          {flair.name}
                        </Badge>
                      </button>
                    ))}
                </div>
              </div>
            )}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Task Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What do you need to do?"
                      className="min-h-[110px] resize-none border-gray-200 text-sm"
                      disabled={disable}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedFlairs.length > 0 && (
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium text-gray-700">Selected Flairs</FormLabel>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md">
                  {selectedFlairs.map((flair) => (
                    <Badge
                      key={flair.id}
                      style={{
                        border: `1px solid ${flair.color}`,
                        backgroundColor: flair.color,
                        color: getContrastTextColor(flair.color),
                      }}
                      className="shadow-xs text-sm flex items-center gap-1"
                    >
                      {flair.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveFlair(flair.id)}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        disabled={disable}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              className="w-full h-8 bg-black text-white"
              disabled={(!form.watch("description")?.trim() && selectedFlairs.length === 0) || disable}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Task
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}