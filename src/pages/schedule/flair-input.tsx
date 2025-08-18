"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"

interface FlairCreatorProps {
  onAddFlair: (name: string, description: string, color: string) => void
}

const formSchema = z.object({
  name: z.string().min(1, "Flair name is required"),
  description: z.string().min(1, "Description is required"),
  color: z.string().min(1, "Color is required"),
})

export function FlairCreator({ onAddFlair }: FlairCreatorProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#69420",
    },
  })

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onAddFlair(values.name, values.description, values.color)
    form.reset()
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Create Flairs</h3>
        </div>
        <Separator className="w-full my-2 bg-gray-400"/>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Flair name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Flair name"
                      className="text-sm h-8"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Description"
                      className="text-sm h-8"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel
                      htmlFor="colorPicker"
                      className="text-sm font-medium text-gray-700"
                    >
                      Select a Color
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="colorPicker"
                        type="color"
                        className="w-10 h-10 p-1 border border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                        aria-label="Choose a color"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <div
                    className="w-10 h-10 rounded-md border border-gray-300"
                    style={{ backgroundColor: field.value }}
                    aria-label={`Selected color: ${field.value}`}
                  />
                  <span className="text-sm text-gray-600">{field.value}</span>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="w-full h-8 bg-transparent"
            >
              <Palette className="w-3 h-3 mr-1" />
              Create
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}