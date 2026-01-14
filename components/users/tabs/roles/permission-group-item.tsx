"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Check, Minus } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const PERMISSION_COLUMNS = [
  { key: "read", label: "READ" },
  { key: "write", label: "WRITE" },
  { key: "create", label: "CREATE" },
  { key: "delete", label: "DELETE" },
  { key: "submit", label: "SUBMIT" },
  { key: "report", label: "REPORT" },
  { key: "export", label: "EXPORT" },
] as const;

type PermissionAction = (typeof PERMISSION_COLUMNS)[number]["key"];

export interface DocumentPermission {
  name: string;
  displayName: string;
  permissions: Record<PermissionAction, boolean>;
}

interface PermissionGroupItemProps {
  groupName: string;
  documents: DocumentPermission[];
  documentCount: number;
  defaultOpen?: boolean;
}

export function PermissionGroupItem({
  groupName,
  documents,
  documentCount,
  defaultOpen = false,
}: PermissionGroupItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border shadow-none rounded-md bg-card text-card-foreground mb-4 overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between px-6 py-4 hover:bg-accent/50 transition-colors",
            "text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
        >
          <div className="flex items-center gap-3">
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
            <span className="font-semibold text-base">{groupName}</span>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {documentCount} {documentCount === 1 ? "Doctype" : "Doctypes"}
          </Badge>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t">
          {/* Permission Matrix Header */}
          <div className="grid grid-cols-[2fr_repeat(7,1fr)] gap-2 px-6 py-3 bg-muted/30 border-b">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
              Document Type
            </div>
            {PERMISSION_COLUMNS.map((col) => (
              <div
                key={col.key}
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center flex items-center justify-center"
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Permission Matrix Rows */}
          <div className="bg-card">
            {documents.map((doc, index) => (
              <div
                key={doc.name}
                className={cn(
                  "grid grid-cols-[2fr_repeat(7,1fr)] gap-2 px-6 py-4 items-center hover:bg-muted/10 transition-colors",
                  index < documents.length - 1 && "border-b border-muted/50"
                )}
              >
                <div className="text-sm font-medium text-foreground">
                  {doc.displayName}
                </div>
                {PERMISSION_COLUMNS.map((col) => (
                  <div key={col.key} className="flex justify-center">
                    {doc.permissions[col.key] ? (
                      <div className="h-6 w-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <Check
                          className="h-4 w-4 text-emerald-600"
                          strokeWidth={2.5}
                        />
                      </div>
                    ) : (
                      <div className="h-6 w-6 flex items-center justify-center opcaity-20">
                        <Minus className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
