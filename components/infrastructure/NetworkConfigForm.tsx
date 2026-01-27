"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Save,
  BadgeCheck,
  Lock,
  Plus,
  Trash2,
  GripVertical,
  SortAsc,
  SortDesc,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/ui/glass";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// DND Kit Imports
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NetworkConfig {
  id: number;
  config_key: string;
  category: string;
  config_value: Record<string, unknown>;
  label: string;
  description: string;
  is_editable: boolean;
}

interface FieldItem {
  id: string;
  key: string;
  value: unknown;
}

interface NetworkConfigFormProps {
  config: NetworkConfig;
  onUpdate?: () => void;
}

// Sortable Item Component
function SortableField({
  field,
  onRemove,
  onKeyChange,
  renderInput,
}: {
  field: FieldItem;
  onRemove: (id: string) => void;
  onKeyChange: (id: string, newKey: string) => void;
  renderInput: (field: FieldItem) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-background/30 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Input
          value={field.key}
          onChange={(e) => onKeyChange(field.id, e.target.value)}
          className="h-8 font-bold bg-transparent border-none p-0 focus-visible:ring-0 text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          placeholder="Nama Field..."
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
          onClick={() => onRemove(field.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="pl-7">{renderInput(field)}</div>
    </div>
  );
}

export function NetworkConfigForm({
  config,
  onUpdate,
}: NetworkConfigFormProps) {
  // Convert object to array for state
  const [fields, setFields] = useState<FieldItem[]>(() =>
    Object.entries(config.config_value).map(([key, value]) => ({
      id: `${key}_${Math.random()}`,
      key,
      value,
    })),
  );

  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking inputs
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Convert array back to object
      const configValue: Record<string, unknown> = {};
      fields.forEach((f) => {
        if (f.key.trim()) {
          configValue[f.key.trim()] = f.value;
        }
      });

      const response = await api.put<{
        success: boolean;
        message: string;
      }>(`/gis/config/${config.config_key}`, {
        config_value: configValue,
      });

      if (response.data.success) {
        toast.success(`Konfigurasi "${config.label}" berhasil disimpan`);
        onUpdate?.();
      }
    } catch {
      toast.error("Gagal menyimpan konfigurasi");
    } finally {
      setLoading(false);
    }
  };

  const updateFieldValue = (id: string, newValue: unknown) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newValue } : f)),
    );
  };

  const updateFieldKey = (id: string, newKey: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, key: newKey } : f)),
    );
  };

  const addField = (type: "string" | "number" | "boolean" | "array") => {
    const defaultVal =
      type === "array"
        ? []
        : type === "boolean"
          ? false
          : type === "number"
            ? 0
            : "";
    const newField: FieldItem = {
      id: `field_${Date.now()}`,
      key: `field_${fields.length + 1}`,
      value: defaultVal,
    };
    setFields((prev) => [...prev, newField]);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const deleteConfigGroup = async () => {
    if (!confirm("Hapus seluruh grup standar ini?")) return;
    try {
      setLoading(true);
      await api.delete(`/gis/config/${config.config_key}`);
      toast.success("Grup standar berhasil dihapus");
      onUpdate?.();
    } catch {
      toast.error("Gagal menghapus grup");
    } finally {
      setLoading(false);
    }
  };

  const sortFields = (direction: "asc" | "desc") => {
    setFields((prev) =>
      [...prev].sort((a, b) => {
        const keyA = a.key.toLowerCase();
        const keyB = b.key.toLowerCase();
        return direction === "asc"
          ? keyA.localeCompare(keyB)
          : keyB.localeCompare(keyA);
      }),
    );
  };

  const renderInputContent = (field: FieldItem) => {
    const { value, id } = field;

    if (typeof value === "number") {
      return (
        <Input
          type="number"
          step="any"
          value={isNaN(value) ? "" : value}
          onChange={(e) => {
            const val = e.target.value;
            updateFieldValue(id, val === "" ? 0 : parseFloat(val));
          }}
          className="bg-background/50"
        />
      );
    }

    if (typeof value === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Aktifkan parameter ini
          </span>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => updateFieldValue(id, checked)}
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <Input
          value={value.join(", ")}
          placeholder="Isi dengan koma (misal: 8, 16, 24)"
          onChange={(e) => {
            const val = e.target.value;
            if (val.trim() === "") {
              updateFieldValue(id, []);
              return;
            }
            updateFieldValue(
              id,
              val.split(",").map((v) => {
                const trimmed = v.trim();
                const isStrictNumeric = /^-?\d*\.?\d+$/.test(trimmed);
                const num = Number(trimmed);
                return isStrictNumeric && !isNaN(num) ? num : trimmed;
              }),
            );
          }}
          className="bg-background/50"
        />
      );
    }

    return (
      <Input
        value={typeof value === "string" ? value : String(value ?? "")}
        onChange={(e) => updateFieldValue(id, e.target.value)}
        className="bg-background/50"
      />
    );
  };

  return (
    <GlassCard
      intensity="medium"
      hoverEffect
      className="flex flex-col h-full border-white/20 dark:border-white/5"
    >
      <CardHeader className="relative">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">
              {config.label}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {config.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => sortFields("asc")}
              title="Sort A-Z"
            >
              <SortAsc className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => sortFields("desc")}
              title="Sort Z-A"
            >
              <SortDesc className="h-4 w-4" />
            </Button>
            {config.is_editable ? (
              <div
                className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-full"
                title="Editable"
              >
                <BadgeCheck className="h-4 w-4" />
              </div>
            ) : (
              <div
                className="bg-muted text-muted-foreground p-1.5 rounded-full"
                title="Read Only"
              >
                <Lock className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 py-4 px-6 overflow-y-auto min-h-[400px]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              <AnimatePresence>
                {fields.map((field) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SortableField
                      field={field}
                      onRemove={removeField}
                      onKeyChange={updateFieldKey}
                      renderInput={renderInputContent}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-6 border-t border-white/10 dark:border-white/5 bg-black/5 dark:bg-white/5">
        <div className="flex gap-2 w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 border-dashed border-white/20 h-10"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Field
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuItem onClick={() => addField("string")}>
                Text Field
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addField("number")}>
                Number Field
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addField("boolean")}>
                Toggle Field
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addField("array")}>
                List (Comma Separated)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 h-10 w-10"
            onClick={deleteConfigGroup}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading || !config.is_editable}
          className={cn(
            "w-full h-11 font-bold transition-all duration-300",
            config.is_editable
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
              : "bg-muted cursor-not-allowed text-muted-foreground",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Standar
            </>
          )}
        </Button>
      </CardFooter>
    </GlassCard>
  );
}
