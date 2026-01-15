"use client";

import * as React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FileIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomFieldDefinition, CustomFieldType } from "@/types/project";

interface FieldRendererProps {
  type: CustomFieldType;
  value: unknown;
  definition?: CustomFieldDefinition;
  className?: string;
  isCompact?: boolean;
}

export function FieldRenderer({
  type,
  value,
  className,
  isCompact = false,
}: FieldRendererProps) {
  if (value === undefined || value === null || value === "") {
    return (
      <span
        className={cn("text-muted-foreground/40 italic text-xs", className)}
      >
        Empty
      </span>
    );
  }

  const renderValue = () => {
    switch (type) {
      case "text":
        return <span className="truncate">{String(value)}</span>;

      case "number":
        return <span>{Number(value).toLocaleString()}</span>;

      case "date":
        try {
          const dateValue =
            typeof value === "string" ||
            typeof value === "number" ||
            value instanceof Date
              ? value
              : String(value);
          return (
            <div className="flex items-center gap-1.5 text-xs">
              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              <span>
                {format(new Date(dateValue as string | number | Date), "PPP")}
              </span>
            </div>
          );
        } catch {
          return <span>Invalid Date</span>;
        }

      case "select":
        return (
          <Badge
            variant="secondary"
            className="font-normal px-2 py-0 h-5 text-[10px]"
          >
            {String(value)}
          </Badge>
        );

      case "multi_select":
        const values = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((v, i) => (
              <Badge
                key={i}
                variant="outline"
                className="font-normal px-1.5 py-0 h-4 text-[9px] bg-muted/30"
              >
                {String(v)}
              </Badge>
            ))}
          </div>
        );

      case "files":
        const files = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-1.5">
            {files.slice(0, 3).map((file, i) => {
              const fileUrl = typeof file === "string" ? file : file.url;
              const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl);

              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1 p-1 rounded border bg-background/50",
                    isCompact ? "h-6 px-1.5" : "h-8 px-2"
                  )}
                >
                  {isImage ? (
                    <ImageIcon className="h-3 w-3 text-blue-500" />
                  ) : (
                    <FileIcon className="h-3 w-3 text-slate-500" />
                  )}
                  {!isCompact && (
                    <span className="text-[10px] truncate max-w-[80px]">
                      {fileUrl.split("/").pop()}
                    </span>
                  )}
                </div>
              );
            })}
            {files.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{files.length - 3}
              </span>
            )}
          </div>
        );

      default:
        return <span>{String(value)}</span>;
    }
  };

  return (
    <div className={cn("inline-flex items-center text-sm", className)}>
      {renderValue()}
    </div>
  );
}
