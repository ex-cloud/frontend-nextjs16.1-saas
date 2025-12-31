"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Check } from "lucide-react";
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

interface DocumentPermission {
  name: string;
  displayName: string;
  permissions: Record<PermissionAction, boolean>;
}

interface PermissionModuleItemProps {
  moduleName: string;
  documents: DocumentPermission[];
  documentCount: number;
  isLast?: boolean;
  defaultOpen?: boolean;
}

export function PermissionModuleItem({
  moduleName,
  documents,
  documentCount,
  isLast = false,
  defaultOpen = false,
}: PermissionModuleItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors",
            "text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
            !isLast && !isOpen && "border-b"
          )}
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
            <span className="font-medium text-sm">{moduleName}</span>
          </div>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {documentCount} {documentCount === 1 ? "Doctype" : "Doctypes"}
          </Badge>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className={cn("bg-muted/30", !isLast && "border-b")}>
          {/* Permission Matrix Header */}
          <div className="grid grid-cols-8 gap-2 px-4 py-2 border-b bg-muted/50">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Document Type
            </div>
            {PERMISSION_COLUMNS.map((col) => (
              <div
                key={col.key}
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center"
              >
                {col.label}
              </div>
            ))}
          </div>

          {/* Permission Matrix Rows */}
          {documents.map((doc, index) => (
            <div
              key={doc.name}
              className={cn(
                "grid grid-cols-8 gap-2 px-4 py-2.5 items-center",
                index < documents.length - 1 && "border-b border-muted"
              )}
            >
              <div className="text-sm font-medium">{doc.displayName}</div>
              {PERMISSION_COLUMNS.map((col) => (
                <div key={col.key} className="flex justify-center">
                  {doc.permissions[col.key] ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
