"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from "@dnd-kit/core";
import { restrictToWindowEdges, snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { TaskList, Task } from "@/types/project";
import { KanbanColumn } from "@/components/projects/kanban/KanbanColumn";
import { KanbanTask } from "@/components/projects/kanban/KanbanTask";
import { TaskDialog } from "@/components/projects/modals/TaskDialog";
import { AddListDialog } from "@/components/projects/modals/AddListDialog";
import { TaskSheet } from "@/components/projects/kanban/TaskSheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { taskService } from "@/lib/api/services/task.service";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  initialLists: TaskList[];
  board: {
    id: string | number;
    project_id: string | number;
  };
  onRefresh?: () => void;
}

export function KanbanBoard({
  initialLists,
  board,
  onRefresh,
}: KanbanBoardProps) {
  const [lists, setLists] = React.useState<TaskList[]>(initialLists);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = React.useState(false);
  const [activeListId, setActiveListId] = React.useState<
    string | number | null
  >(null);

  // Helper functions - defined BEFORE useEffect that uses them
  const findContainer = React.useCallback(
    (id: string | number) => {
      if (lists.find((l) => String(l.id) === String(id))) {
        return lists.find((l) => String(l.id) === String(id));
      }
      return lists.find((list) =>
        list.tasks?.some((task) => String(task.id) === String(id))
      );
    },
    [lists]
  );

  const findTaskById = React.useCallback(
    (id: string | number): Task | null => {
      for (const list of lists) {
        const task = list.tasks?.find((t) => String(t.id) === String(id));
        if (task) return task;
      }
      return null;
    },
    [lists]
  );

  // Sync state when initialLists prop changes (single useEffect, no duplicates)
  React.useEffect(() => {
    setLists(initialLists);
  }, [initialLists]);

  // Update selectedTask when lists change (separate effect for clarity)
  React.useEffect(() => {
    if (selectedTask) {
      const refreshedTask = findTaskById(selectedTask.id);
      if (refreshedTask && refreshedTask !== selectedTask) {
        setSelectedTask(refreshedTask);
      }
    }
  }, [lists, selectedTask, findTaskById]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string | number);
    if (task) setActiveTask(task);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId as string | number);
    const overContainer = findContainer(overId as string | number);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer.id === overContainer.id
    ) {
      return;
    }

    setLists((prev) => {
      const activeItems = activeContainer.tasks || [];
      const overItems = overContainer.tasks || [];

      const activeIndex = activeItems.findIndex(
        (i: Task) => String(i.id) === String(activeId)
      );
      const overIndex = overItems.findIndex(
        (i: Task) => String(i.id) === String(overId)
      );

      let newIndex: number;
      if (overContainer.id === overId) {
        newIndex = overItems.length;
      } else {
        const isBelowLastItem =
          overIndex === overItems.length - 1 &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowLastItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
      }

      return prev.map((list: TaskList) => {
        if (list.id === activeContainer.id) {
          return {
            ...list,
            tasks: activeItems.filter(
              (i: Task) => String(i.id) !== String(activeId)
            ),
          };
        }
        if (list.id === overContainer.id) {
          const newTasks = [...overItems];
          const taskToMove = activeItems[activeIndex];
          if (taskToMove) {
            newTasks.splice(newIndex, 0, {
              ...taskToMove,
              list_id: overContainer.id,
            });
          }
          return {
            ...list,
            tasks: newTasks,
          };
        }
        return list;
      });
    });
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string | number;
    const overId = over.id as string | number;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    const overTasks = overContainer.tasks || [];
    let overIndex = overTasks.findIndex(
      (i: Task) => String(i.id) === String(overId)
    );

    // If dropping on the container itself (empty or bottom), place at the end
    if (overIndex === -1) {
      overIndex = overTasks.length;
    }

    try {
      const updatedTask = await taskService.moveTask(
        activeId,
        overContainer.id,
        overIndex
      );

      // Update local state with the returned task to ensure status and other fields are synced
      setLists((prev) => {
        return prev.map((list) => {
          if (list.id === overContainer.id) {
            return {
              ...list,
              tasks: list.tasks?.map((t) =>
                String(t.id) === String(updatedTask.id) ? { ...updatedTask } : t
              ),
            };
          }
          return list;
        });
      });

      // Also update active/selected task if it matches
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    } catch (error) {
      console.error("Move task failed:", error);
      toast.error("Failed to persist task move");
      if (onRefresh) onRefresh();
    }
  };

  const handleAddTask = (listId: string | number) => {
    setActiveListId(listId);
    setIsTaskDialogOpen(true);
  };

  const collisionDetectionStrategy: CollisionDetection = React.useCallback(
    (args) => {
      // First, try to find collisions with sortable items
      const closestSortable = closestCorners(args);
      if (closestSortable.length > 0) return closestSortable;

      // If no sortable items found (e.g., empty column), find the container
      return rectIntersection(args) || pointerWithin(args);
    },
    []
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <ScrollArea className="h-full">
        <div className="flex gap-6 p-6 h-full items-start">
          <SortableContext items={lists.map((l: TaskList) => l.id)}>
            {lists.map((list: TaskList) => (
              <KanbanColumn
                key={list.id}
                list={list}
                onAddTask={handleAddTask}
                onTaskClick={setSelectedTask}
              />
            ))}
          </SortableContext>

          <Button
            variant="outline"
            className="w-[300px] h-12 flex-shrink-0 border-dashed gap-2"
            onClick={() => setIsListDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add List
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay
        modifiers={[restrictToWindowEdges, snapCenterToCursor]}
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}
      >
        {activeTask ? <KanbanTask task={activeTask} isOverlay /> : null}
      </DragOverlay>

      <TaskSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onRefresh={onRefresh}
      />

      {isTaskDialogOpen && (
        <TaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          projectId={board.project_id}
          boardId={board.id}
          listId={activeListId || lists[0]?.id || ""}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            else window.location.reload();
          }}
        />
      )}

      <AddListDialog
        open={isListDialogOpen}
        onOpenChange={setIsListDialogOpen}
        boardId={board.id}
        onSuccess={() => {
          if (onRefresh) onRefresh();
          else window.location.reload();
        }}
      />
    </DndContext>
  );
}
