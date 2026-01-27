"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Save, Settings2 } from "lucide-react";
import { SortableItem } from "./sortable-item";
import { StaggerContainer } from "@/components/ui/motion";

interface SortableDashboardProps {
  children: React.ReactNode;
  storeKey?: string;
  className?: string;
  defaultLayout: string[];
}

export function SortableDashboard({
  children,
  storeKey = "dashboard-layout",
  className,
  defaultLayout,
}: SortableDashboardProps) {
  const [items, setItems] = useLocalStorage<string[]>(storeKey, defaultLayout);
  const [isEditing, setIsEditing] = useState(false);

  // Use useSyncExternalStore for hydration-safe mounted check
  // This is the React 18+ recommended pattern
  const mounted = React.useSyncExternalStore(
    () => () => {}, // subscribe (no-op on client)
    () => true, // getSnapshot (client: always true)
    () => false, // getServerSnapshot (server: always false)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.indexOf(active.id as string);
        const newIndex = prevItems.indexOf(over?.id as string);
        return arrayMove(prevItems, oldIndex, newIndex);
      });
    }
  };

  // Create a map of children by key/id for easy rendering based on sort order
  const childrenMap = useMemo(() => {
    return React.Children.toArray(children).reduce(
      (acc: Record<string, React.ReactNode>, child) => {
        if (React.isValidElement(child) && child.key) {
          // Strip out the .$ prefix that React adds to keys
          acc[child.key.replace(/^\.\$/, "")] = child;
        }
        return acc;
      },
      {},
    );
  }, [children]);

  // Memoize finalItems to prevent dependency array issues
  const finalItems = useMemo(() => {
    // Filter items to ensure they exist in children (sync check)
    const activeItems = items.filter((id) => childrenMap[id] !== undefined);
    // Find any new children that aren't in stored layout yet and append them
    const newChildKeys = Object.keys(childrenMap).filter(
      (key) => !items.includes(key),
    );
    return [...activeItems, ...newChildKeys];
  }, [items, childrenMap]);

  // Sync new items to storage when layout changes
  const prevLengthRef = useRef(items.length);
  useEffect(() => {
    if (finalItems.length !== prevLengthRef.current) {
      prevLengthRef.current = finalItems.length;
      setItems(finalItems);
    }
  }, [finalItems, setItems]);

  // Server-side render fallback (before hydration)
  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex justify-end items-center px-4 -mb-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground animate-pulse">
              Drag items to reorder
            </span>
            <Button
              size="sm"
              variant="default"
              onClick={() => setIsEditing(false)}
              className="h-8 gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4" /> Save Layout
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="w-4 h-4" /> Customize
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={finalItems} strategy={rectSortingStrategy}>
          <StaggerContainer className={className} staggerChildren={0.05}>
            {finalItems.map((id) => (
              <SortableItem key={id} id={id} isEditing={isEditing}>
                {childrenMap[id]}
              </SortableItem>
            ))}
          </StaggerContainer>
        </SortableContext>
      </DndContext>
    </div>
  );
}
