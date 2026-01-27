"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Save,
  Settings2,
  RotateCcw,
  GripVertical,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DEFAULT_LAYOUT,
  LAYOUT_STORAGE_KEY,
  swapWidgets,
  toggleWidgetVisibility,
  resizeWidget,
  WidgetConfig,
  GRID_COLUMNS,
} from "@/lib/dashboard-config";

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

interface DraggableWidgetProps {
  id: string;
  config: WidgetConfig;
  isEditing: boolean;
  children: React.ReactNode;
  onToggleVisibility: (id: string) => void;
  onResize: (id: string, delta: number) => void;
}

// Visual Grid Overlay
function BackgroundGrid({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute inset-0 grid gap-4 pointer-events-none z-0"
      style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}
    >
      {Array.from({ length: GRID_COLUMNS }).map((_, i) => (
        <div
          key={i}
          className="h-full bg-primary/5 border-l border-r border-primary/10 flex items-start justify-center pt-2"
        >
          <span className="text-[10px] font-mono text-primary/30">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

function DraggableWidget({
  id,
  config,
  isEditing,
  onToggleVisibility,
  onResize,
  children,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style: React.CSSProperties = {
    gridRow: config.gridRow,
    gridColumn: config.gridColumn,
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : config.visible || isEditing ? 1 : 0,
    display: !config.visible && !isEditing ? "none" : "block", // Hide completely in view mode
  };

  // Calculate current span for display
  const [startStr, endStr] = config.gridColumn.split("/").map((s) => s.trim());
  const span = parseInt(endStr) - parseInt(startStr);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/widget h-full",
        isEditing &&
          "ring-2 ring-dashed ring-primary/30 rounded-xl bg-background/50 backdrop-blur-sm",
        isDragging && "ring-primary scale-[1.02] shadow-2xl",
        !config.visible && isEditing && "opacity-50 grayscale",
      )}
    >
      {/* Edit Overlay - Only visible in Edit Mode */}
      {isEditing && (
        <>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-primary text-primary-foreground rounded-full shadow-lg cursor-grab flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover/widget:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3" />
            <span>{config.label}</span>
          </div>

          {/* Visibility Toggle */}
          <button
            onClick={() => onToggleVisibility(id)}
            className="absolute top-2 right-2 z-30 p-1.5 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border/50 hover:bg-accent opacity-0 group-hover/widget:opacity-100 transition-opacity"
            title={config.visible ? "Hide Widget" : "Show Widget"}
          >
            {config.visible ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-destructive" />
            )}
          </button>

          {/* Resize Controls */}
          {config.visible && (
            <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1 opacity-0 group-hover/widget:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border/50 p-1">
              <button
                onClick={() => onResize(id, -1)}
                className="p-1 hover:bg-accent rounded"
                title="Shrink"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-mono font-medium min-w-[20px] text-center">
                {span}
              </span>
              <button
                onClick={() => onResize(id, 1)}
                className="p-1 hover:bg-accent rounded"
                title="Expand"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Hidden Indicator */}
          {!config.visible && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className="bg-destructive/10 text-destructive text-sm font-bold px-3 py-1 rounded-full border border-destructive/20 backdrop-blur-md">
                HIDDEN
              </span>
            </div>
          )}
        </>
      )}
      {children}
    </div>
  );
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  const [layout, setLayout] = useLocalStorage(
    LAYOUT_STORAGE_KEY,
    DEFAULT_LAYOUT,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Use useSyncExternalStore for hydration-safe mounted check (React 18+ pattern)
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setLayout(swapWidgets(layout, active.id as string, over.id as string));
    }
  };

  const handleReset = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, [setLayout]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    // Layout is already persisted via useLocalStorage
  }, []);

  const handleToggleVisibility = useCallback(
    (id: string) => {
      setLayout((prev) => toggleWidgetVisibility(prev, id));
    },
    [setLayout],
  );

  const handleResize = useCallback(
    (id: string, delta: number) => {
      setLayout((prev) => resizeWidget(prev, id, delta));
    },
    [setLayout],
  );

  // Create a map of children by key
  const childrenMap = useMemo(() => {
    return React.Children.toArray(children).reduce(
      (acc: Record<string, React.ReactNode>, child) => {
        if (React.isValidElement(child) && child.key) {
          acc[child.key.replace(/^\.\$/, "")] = child;
        }
        return acc;
      },
      {},
    );
  }, [children]);

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end items-center gap-2"
      >
        {isEditing ? (
          <>
            <span className="text-sm text-muted-foreground animate-pulse mr-2">
              Drag to swap • Resize columns
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="h-8 gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4" /> Save Layout
            </Button>
          </>
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
      </motion.div>

      {/* Grid Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={cn(
            "grid gap-4 transition-all duration-300 relative",
            className,
          )}
          style={{
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
            gridAutoRows: "minmax(180px, auto)",
          }}
        >
          {/* Background Grid Visualization */}
          <BackgroundGrid visible={isEditing} />

          {layout.widgets.map(
            (config) =>
              // Render widget if visible OR if editing (so we can unhide it)
              (config.visible || isEditing) && (
                <DraggableWidget
                  key={config.id}
                  id={config.id}
                  config={config}
                  isEditing={isEditing}
                  onToggleVisibility={handleToggleVisibility}
                  onResize={handleResize}
                >
                  {childrenMap[config.id] || (
                    <div className="p-4 bg-muted/50 rounded-xl h-full flex items-center justify-center text-muted-foreground">
                      Widget: {config.id}
                    </div>
                  )}
                </DraggableWidget>
              ),
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && childrenMap[activeId] ? (
            <div className="opacity-80 scale-105 shadow-2xl rounded-xl">
              {childrenMap[activeId]}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
