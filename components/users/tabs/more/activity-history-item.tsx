"use client";

import React from "react";
import { ActivityLog } from "@/types/user";
import {
  Edit,
  PlusCircle,
  Trash2,
  FileText,
  Shield,
  Key,
  Database,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateValue } from "@/lib/utils/format-date";

interface ActivityHistoryItemProps {
  log: ActivityLog;
  isLast: boolean;
}

// Helper functions defined outside component to avoid recreation/lint errors
const getIcon = (description: string): LucideIcon => {
  const desc = description.toLowerCase();
  if (desc.includes("created")) return PlusCircle;
  if (desc.includes("deleted")) return Trash2;
  if (desc.includes("updated")) return Edit;
  if (desc.includes("sync") || desc.includes("attach")) return Database;
  if (desc.includes("role")) return Shield;
  if (desc.includes("permission")) return Key;
  return FileText;
};

const getIconColor = (description: string): string => {
  const desc = description.toLowerCase();
  if (desc.includes("created")) return "text-green-500 bg-green-50";
  if (desc.includes("deleted")) return "text-red-500 bg-red-50";
  if (desc.includes("updated")) return "text-blue-500 bg-blue-50";
  return "text-gray-500 bg-gray-50";
};

// Use centralized formatValue from format-date utility
function formatValue(value: unknown): string {
  return formatDateValue(value);
}

export function ActivityHistoryItem({ log, isLast }: ActivityHistoryItemProps) {
  const Icon = getIcon(log.description);
  const iconColorClass = getIconColor(log.description);

  // Parse properties for diffs
  const properties = log.properties as
    | {
        old?: Record<string, unknown>;
        attributes?: Record<string, unknown>;
        roles?: string; // Special case for manual role log
      }
    | undefined;

  const oldValues = properties?.old || {};
  const newValues = properties?.attributes || {}; // standard attributes
  const manualRoles = properties?.roles; // fallback for manual role log if any

  // Detect Type
  const subjectType = log.subject_type?.split("\\").pop(); // e.g. "Comment", "User", "TeamMember"
  const isComment =
    subjectType === "Comment" ||
    log.description.toLowerCase().includes("comment");

  // Find changed keys (only for standard updates)
  const changedKeys = Object.keys(newValues).filter((key) => {
    if (key === "updated_at") return false;
    return JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key]);
  });

  const hasDiffs = changedKeys.length > 0;

  // Enhance description if generic
  let displayDescription: React.ReactNode = log.description;
  if (
    log.description.toLowerCase() === "updated user" &&
    changedKeys.length > 0
  ) {
    const keysToShow = changedKeys.slice(0, 3).map((k) => k.replace(/_/g, " "));
    const suffix =
      changedKeys.length > 3 ? ` +${changedKeys.length - 3} more` : "";
    displayDescription = `Updated ${keysToShow.join(", ")}${suffix}`;
  } else if (
    log.description.startsWith("Added attachment") &&
    newValues.file_url
  ) {
    // Handle clickable attachment
    const fileName = String(
      newValues.file_name || log.description.replace("Added attachment ", "")
    );
    const url = String(newValues.file_url);

    displayDescription = (
      <span>
        Added attachment{" "}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline hover:text-primary/80 font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {fileName}
        </a>
      </span>
    );
  }

  const displayTime = log.created_at_human || "Just now";

  return (
    <div className="relative pl-8 md:pl-10 py-4 group">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-3 md:left-4 top-8 bottom-0 w-px bg-border group-last:hidden" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "absolute left-0 md:left-1 top-2 h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center border shadow-sm z-10 bg-background transition-colors",
          iconColorClass
        )}
      >
        {React.createElement(Icon, { className: "h-3 w-3 md:h-4 md:w-4" })}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
            <span className="font-semibold text-foreground">
              {log.causer ? log.causer.name : "System"}
            </span>
            <span className="text-muted-foreground/80 lowercase first-letter:uppercase">
              {displayDescription}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto mt-1 sm:mt-0">
            <span className="text-[10px] md:text-xs font-normal text-muted-foreground whitespace-nowrap">
              {displayTime}
            </span>
          </div>
        </div>

        {/* Dynamic Content Body */}

        {/* CASE: Comment - Show Blockquote */}
        {isComment && typeof newValues.body === "string" && (
          <div className="mt-2 p-3 rounded-md bg-muted/30 border-l-4 border-primary/50 text-sm italic text-muted-foreground">
            &quot;{newValues.body}&quot;
          </div>
        )}

        {/* CASE: Attachment - Show File Badge (implied) */}
        {/* (Description already says "Added attachment...", usually enough, but we could add a file icon here if we had properties) */}

        {/* CASE: Standard Diff Table */}
        {!isComment && hasDiffs && (
          <div className="mt-2 rounded-md border bg-card overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-4 py-2 grid grid-cols-10 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
              <div className="col-span-3">Field</div>
              <div className="col-span-3">Old Value</div>
              <div className="col-span-4">New Value</div>
            </div>
            <div className="divide-y">
              {changedKeys.map((key) => {
                const oldValue = formatValue(oldValues[key]);
                const newValue = formatValue(newValues[key]);

                return (
                  <div
                    key={key}
                    className="grid grid-cols-10 px-4 py-3 text-sm items-center hover:bg-muted/20 transition-colors"
                  >
                    <div
                      className="col-span-3 font-medium text-muted-foreground truncate"
                      title={key}
                    >
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="col-span-3 text-red-600 font-mono text-xs break-all">
                      {oldValue !== "-" ? (
                        oldValue
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </div>
                    <div className="col-span-4 text-green-600 font-mono text-xs break-all font-semibold">
                      {newValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Role Log Fallback (if using old format in some legacy logs) */}
        {manualRoles && !hasDiffs && (
          <div className="mt-2 text-sm text-muted-foreground">
            Roles:{" "}
            <span className="font-medium text-foreground">{manualRoles}</span>
          </div>
        )}
      </div>
    </div>
  );
}
