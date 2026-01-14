"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { projectService } from "@/lib/api/services/project.service";
import { toast } from "sonner";

const listSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});

type ListFormValues = z.infer<typeof listSchema>;

interface AddListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string | number;
  onSuccess?: () => void;
}

const COLORS = [
  { label: "Slate", value: "#64748b" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Violet", value: "#8b5cf6" },
];

export function AddListDialog({
  open,
  onOpenChange,
  boardId,
  onSuccess,
}: AddListDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const form = useForm<ListFormValues>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: "",
      color: "#64748b",
    },
  });

  async function onSubmit(values: ListFormValues) {
    setLoading(true);
    try {
      await projectService.createList(boardId, values.name, values.color);
      toast.success("List created successfully");
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch {
      toast.error("Failed to create list");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New List</DialogTitle>
          <DialogDescription>
            Create a new column to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>List Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. In Progress" {...field} />
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
                  <FormLabel>Color</FormLabel>
                  <div className="flex gap-2 pt-1">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          field.value === c.value
                            ? "border-primary scale-110 shadow-sm"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => field.onChange(c.value)}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create List"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
