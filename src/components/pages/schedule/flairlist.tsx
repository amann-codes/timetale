import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Flair } from "@/lib/types"
import { getContrastTextColor } from "@/lib/utils"
import { Pencil } from "lucide-react"
import { useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface FlairFormInputs {
    id: string
    name: string
    color: string
    description: string
}

const formSchema = z.object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Flair name is required"),
    description: z.string().min(1, "Description is required"),
    color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid hex color"),
})

interface FlairListProps {
    flairs: Flair[]
    onUpdateFlair: (id: string, name: string, description: string, color: string) => void
}

export const FlairList = ({ flairs, onUpdateFlair }: FlairListProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedFlair, setSelectedFlair] = useState<Flair | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: "",
            name: "",
            description: "",
            color: "#069420",
        },
    })

    const { reset } = form

    const onSubmit: SubmitHandler<FlairFormInputs> = (data) => {
        if (selectedFlair) {
            onUpdateFlair(data.id, data.name, data.description, data.color)
            setIsDialogOpen(false)
            setSelectedFlair(null)
            reset()
        }
    }

    const handleEditClick = (flair: Flair) => {
        setSelectedFlair(flair)
        reset({
            id: flair.id,
            name: flair.name,
            color: flair.color,
            description: flair.description || "",
        })
        setIsDialogOpen(true)
    }

    const handleCancel = () => {
        setIsDialogOpen(false)
        setSelectedFlair(null)
        reset()
    }

    return (
        <Card>
            <CardHeader className="flex items-center">
                <CardTitle>Your Flairs</CardTitle>
                {Array.isArray(flairs) && flairs?.map((flair, index) => (
                    <div key={index} className="relative group">
                        <Badge
                            style={{
                                border: `1px solid ${getContrastTextColor(flair.color)}`,
                                backgroundColor: flair.color,
                                color: getContrastTextColor(flair.color),
                            }}
                            className="shadow-xs mx-1 text-sm transition-all group-hover:pr-6"
                        >
                            {flair.name}
                        </Badge>
                        <button
                            onClick={() => handleEditClick(flair)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Edit ${flair.name}`}
                        >
                            <Pencil style={{ color: getContrastTextColor(flair.color) }} className="w-4 h-4 mr-1 hover:cursor-pointer" />
                        </button>
                    </div>
                ))}
            </CardHeader>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Flair</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="id"
                                render={({ field }) => (
                                    <FormItem hidden>
                                        <FormControl>
                                            <Input type="hidden" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="h-8"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" className="h-8">
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </Card>
    )
}