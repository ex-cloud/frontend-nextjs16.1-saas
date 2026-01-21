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
  arrayMove,
} from "@dnd-kit/sortable";
import type {
  TaskList,
  Task,
  CustomFieldDefinition,
  CustomFieldType,
} from "@/types/project";
import { KanbanColumn } from "@/components/projects/kanban/KanbanColumn";
import { KanbanTask } from "@/components/projects/kanban/KanbanTask";
import { TaskDialog } from "@/components/projects/modals/TaskDialog";
import { AddListDialog } from "@/components/projects/modals/AddListDialog";
import { TaskSheet } from "@/components/projects/kanban/TaskSheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { taskService } from "@/lib/api/services/task.service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useBroadcastChannel } from "@/lib/broadcast";
import { createEcho } from "@/lib/echo";
import Echo from "laravel-echo";

interface KanbanBoardProps {
  initialLists: TaskList[];
  board: {
    id: string | number;
    project_id: string | number;
  };
  onRefresh?: () => void;
  customFieldDefinitions?: CustomFieldDefinition[];
  onAddProperty?: (type: CustomFieldType) => void;
}

export function KanbanBoard({
  initialLists,
  board,
  onRefresh,
  customFieldDefinitions,
  onAddProperty,
}: KanbanBoardProps) {
  const [lists, setLists] = React.useState<TaskList[]>(initialLists);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = React.useState(false);
  const [activeListId, setActiveListId] = React.useState<
    string | number | null
  >(null);

  // Cross-tab synchronization
  const { broadcast } = useBroadcastChannel();

  // Real-time synchronization (Cross-device/User)
  React.useEffect(() => {
    let echoInstance: Echo<"pusher"> | null = null;
    const channelName = `projects.${board.project_id}`;

    const setupRealtime = async () => {
      const echo = await createEcho();
      if (!echo) return;
      echoInstance = echo;

      const channel = echo.private(channelName);

      channel.listen(".task.moved", (e: { task: Task }) => {
        console.log("[KanbanBoard] Task moved event received:", e);
        if (onRefresh) onRefresh();

        // Update selected task in modal if it's the one that moved
        setSelectedTask((prev) => {
          if (prev && String(prev.id) === String(e.task.id)) {
            return e.task;
          }
          return prev;
        });
      });

      channel.listen(
        ".task.deleted",
        (e: { projectId: number | string; taskId: number | string }) => {
          console.log("[KanbanBoard] Task deleted event received:", e);
          if (onRefresh) onRefresh();

          // Close modal if the open task was deleted
          setSelectedTask((prev) => {
            if (prev && String(prev.id) === String(e.taskId)) {
              return null;
            }
            return prev;
          });
        },
      );
    };

    setupRealtime();

    return () => {
      if (echoInstance) {
        echoInstance.leave(channelName);
      }
    };
  }, [board.project_id, onRefresh]);

  // Helper to cleanup dnd-kit IDs
  const cleanupId = (id: string | number) => {
    return String(id).replace(/^(task-|col-)/, "");
  };

  // Helper functions - defined BEFORE useEffect that uses them
  // Helper functions - defined BEFORE useEffect that uses them
  const findContainer = React.useCallback(
    (id: string | number) => {
      const strId = String(id);
      const clean = cleanupId(id);

      // Strict checking based on prefix
      if (strId.startsWith("col-")) {
        return lists.find((l) => String(l.id) === clean);
      }

      if (strId.startsWith("task-")) {
        return lists.find((list) =>
          list.tasks?.some((task) => String(task.id) === clean),
        );
      }

      // Fallback for legacy/unprefixed (shouldn't happen in normal flow)
      if (lists.find((l) => String(l.id) === clean)) {
        return lists.find((l) => String(l.id) === clean);
      }
      return lists.find((list) =>
        list.tasks?.some((task) => String(task.id) === clean),
      );
    },
    [lists],
  );

  const findTaskById = React.useCallback(
    (id: string | number): Task | null => {
      const clean = cleanupId(id);
      for (const list of lists) {
        const task = list.tasks?.find((t) => String(t.id) === clean);
        if (task) return task;
      }
      return null;
    },
    [lists],
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
    }),
  );

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string | number);
    if (task) setActiveTask(task);
  };

  const mapStatusFromSlug = (slug: string): string => {
    const s = slug.toLowerCase();
    if (s.includes("done") || s.includes("complete")) return "done";
    if (s.includes("review") || s.includes("qa")) return "review";
    if (s.includes("progress") || s.includes("doing")) return "in_progress";
    if (s.includes("todo") || s.includes("to-do")) return "todo";
    return s.replace("-", "_");
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

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
        (i: Task) => String(i.id) === cleanupId(activeId),
      );
      const overIndex = overItems.findIndex(
        (i: Task) => String(i.id) === cleanupId(overId),
      );

      let newIndex: number;
      if (String(overId).startsWith("col-")) {
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
              (i: Task) => String(i.id) !== cleanupId(activeId),
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
              status: mapStatusFromSlug(overContainer.slug),
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

    const activeId = String(active.id);
    const overId = String(over.id);
    const cleanActiveId = cleanupId(activeId);
    const cleanOverId = cleanupId(overId);

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    // Handle reordering in same container
    if (activeContainer.id === overContainer.id) {
      const tasks = activeContainer.tasks || [];
      const activeIndex = tasks.findIndex(
        (t) => String(t.id) === cleanActiveId,
      );
      const overIndex = tasks.findIndex((t) => String(t.id) === cleanOverId);

      if (activeIndex !== overIndex) {
        // Capture previous state for rollback
        const previousLists = [...lists];

        // Optimistic update
        const newTasks = arrayMove(tasks, activeIndex, overIndex);

        setLists((prev) =>
          prev.map((l) => {
            if (l.id === activeContainer.id) {
              return { ...l, tasks: newTasks };
            }
            return l;
          }),
        );

        try {
          await taskService.moveTask(
            cleanActiveId,
            activeContainer.id,
            overIndex,
          );
        } catch {
          // Rollback on failure
          setLists(previousLists);
          toast.error("Failed to move task. Reverting...");
          if (onRefresh) onRefresh();
        }
      }
      return;
    }

    // Handle moving to different container
    const overTasks = overContainer.tasks || [];
    let overIndex = overTasks.findIndex(
      (i: Task) => String(i.id) === cleanOverId,
    );

    // If dropping on the container itself (empty or bottom), place at the end
    if (overIndex === -1 && overId.startsWith("col-")) {
      overIndex = overTasks.length;
    } else if (overIndex === -1) {
      // In case we dropped on an empty list but didn't match the col- ID for some reason
      overIndex = overTasks.length;
    }

    // Capture previous state for rollback
    const previousLists = [...lists];

    // Optimistically update local state to move the task
    setLists((prev) => {
      // 1. Find the task in the current state (prev) regardless of where findContainer thought it was
      let sourceListIndex = -1;
      let taskIndex = -1;
      let taskToMove: Task | undefined;

      for (let i = 0; i < prev.length; i++) {
        const tIndex = prev[i].tasks?.findIndex(
          (t) => String(t.id) === cleanActiveId,
        );
        if (tIndex !== undefined && tIndex !== -1) {
          sourceListIndex = i;
          taskIndex = tIndex;
          taskToMove = prev[i].tasks![tIndex];
          break;
        }
      }

      // 2. Find the target list
      const targetListIndex = prev.findIndex(
        (l) => String(l.id) === String(overContainer.id),
      );

      if (!taskToMove || sourceListIndex === -1 || targetListIndex === -1) {
        return prev;
      }

      // 3. Create new state
      const newLists = [...prev];

      // If source and target are same (meaning onDragOver already moved it completely),
      // we might just need to ensure order, but usually onDragOver handles visual.
      if (sourceListIndex === targetListIndex) {
        return prev;
      }

      // 4. Remove from source
      const newSourceTasks = [...(newLists[sourceListIndex].tasks || [])];
      newSourceTasks.splice(taskIndex, 1);
      newLists[sourceListIndex] = {
        ...newLists[sourceListIndex],
        tasks: newSourceTasks,
      };

      // 5. Add to target
      const newTargetTasks = [...(newLists[targetListIndex].tasks || [])];
      // Clamp index
      let insertIndex = overIndex;
      if (insertIndex < 0) insertIndex = newTargetTasks.length;
      if (insertIndex > newTargetTasks.length)
        insertIndex = newTargetTasks.length;

      newTargetTasks.splice(insertIndex, 0, {
        ...taskToMove,
        list_id: newLists[targetListIndex].id,
        status: mapStatusFromSlug(newLists[targetListIndex].slug),
      });
      newLists[targetListIndex] = {
        ...newLists[targetListIndex],
        tasks: newTargetTasks,
      };

      return newLists;
    });

    try {
      const updatedTask = await taskService.moveTask(
        cleanActiveId,
        overContainer.id,
        overIndex,
      );

      // Update local state with the returned task to ensure complete synchronization
      setLists((prev) => {
        return prev.map((list) => {
          if (list.id === overContainer.id) {
            return {
              ...list,
              tasks: list.tasks?.map((t) =>
                String(t.id) === String(updatedTask.id)
                  ? { ...updatedTask }
                  : t,
              ),
            };
          }
          return list;
        });
      });

      // Broadcast to other tabs that task was moved (for real-time sync)
      broadcast("TASK_MOVED", {
        projectId: board.project_id,
        taskId: updatedTask.id,
        listId: overContainer.id,
      });

      // Also update active/selected task if it matches (Safe comparison)
      if (selectedTask && String(selectedTask.id) === String(updatedTask.id)) {
        setSelectedTask(updatedTask);
      }
    } catch {
      // Rollback on failure
      setLists(previousLists);
      toast.error("Failed to persist task move. Reverting...");
      if (onRefresh) onRefresh();
    }
  };

  const handleAddTask = (listId: string | number) => {
    setActiveListId(listId);
    setIsTaskDialogOpen(true);
  };

  const collisionDetectionStrategy: CollisionDetection = React.useCallback(
    (args) => {
      // Use pointerWithin first for precision, fallback to rectIntersection/closestCorners
      return (
        pointerWithin(args) || rectIntersection(args) || closestCorners(args)
      );
    },
    [],
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
          <SortableContext items={lists.map((l: TaskList) => `col-${l.id}`)}>
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
        customFieldDefinitions={customFieldDefinitions}
        onAddProperty={onAddProperty}
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
