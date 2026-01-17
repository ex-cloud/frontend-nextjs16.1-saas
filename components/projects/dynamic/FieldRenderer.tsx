"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  File as FileIcon,
  CheckSquare,
  Square,
  Link as LinkIcon,
  Mail,
  Phone,
  Clock,
  Star,
  ArrowRight,
  Eye,
} from "lucide-react";
const CalendarIcon = Calendar;
import { cn } from "@/lib/utils";
import {
  CustomFieldDefinition,
  CustomFieldType,
  CustomFieldFile,
} from "@/types/project";

interface FieldRendererProps {
  type: CustomFieldType;
  value: unknown;
  definition?: CustomFieldDefinition;
  className?: string;
  isCompact?: boolean;
}

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function FieldRenderer({
  type,
  value,
  className,
  isCompact = false,
}: FieldRendererProps) {
  const [previewFile, setPreviewFile] = React.useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "object" && Object.keys(value).length === 0)
  ) {
    if (type === "checkbox") {
      return <Square className="h-4 w-4 text-muted-foreground/30" />;
    }
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
      case "created_at":
      case "updated_at":
        try {
          const dateStr = String(value);
          if (dateStr.includes(" -> ")) {
            const [startSub, endSub] = dateStr.split(" -> ");
            const hasTimeStart =
              startSub.includes(":") || startSub.includes("T");
            const hasTimeEnd = endSub.includes(":") || endSub.includes("T");
            const startObj = new Date(startSub);
            const endObj = new Date(endSub);

            if (!isValid(startObj) || !isValid(endObj))
              return <span>Invalid Range</span>;

            return (
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground/80">
                <CalendarIcon className="h-3 w-3 text-muted-foreground/50" />
                <span>
                  {format(startObj, hasTimeStart ? "MMM d, HH:mm" : "MMM d")}
                </span>
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30" />
                <span>
                  {format(endObj, hasTimeEnd ? "MMM d, HH:mm" : "MMM d")}
                </span>
              </div>
            );
          }

          const hasTime = dateStr.includes(":") || dateStr.includes("T");
          const dateObj = new Date(dateStr);

          if (!isValid(dateObj)) return <span>Invalid Date</span>;

          return (
            <div className="flex items-center gap-1.5 text-xs">
              {type === "created_at" || type === "updated_at" ? (
                <Clock className="h-3 w-3 text-muted-foreground" />
              ) : (
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              )}
              <span>{format(dateObj, hasTime ? "PPP HH:mm" : "PPP")}</span>
            </div>
          );
        } catch {
          return <span>Invalid Date</span>;
        }

      case "checkbox":
        return value === true || value === "true" || value === 1 ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4 text-muted-foreground/30" />
        );

      case "url":
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="h-3 w-3" />
            <span className="truncate max-w-[150px]">{String(value)}</span>
          </a>
        );

      case "email":
        return (
          <a
            href={`mailto:${String(value)}`}
            className="flex items-center gap-1 text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-3 w-3" />
            <span className="truncate">{String(value)}</span>
          </a>
        );

      case "phone":
        return (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{String(value)}</span>
          </div>
        );

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
          <>
            <div className="flex flex-wrap gap-1.5">
              {files.slice(0, 4).map((file: CustomFieldFile, i: number) => {
                const fileUrl = typeof file === "string" ? file : file.url;
                const fileName =
                  typeof file === "string"
                    ? (file as string).split("/").pop()
                    : file.name;
                if (!fileUrl) return null;

                const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl);
                const isPdf = /\.pdf$/i.test(fileUrl);
                const isWord = /\.(doc|docx)$/i.test(fileUrl);
                const isExcel = /\.(xls|xlsx|csv)$/i.test(fileUrl);
                const isPpt = /\.(ppt|pptx)$/i.test(fileUrl);
                const isZip = /\.(zip|rar|7z)$/i.test(fileUrl);

                return (
                  <div
                    key={i}
                    className={cn(
                      "relative group/file flex items-center justify-center rounded overflow-hidden border bg-background/50",
                      isCompact ? "h-6 w-6" : "h-9 w-9"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isImage) {
                        setPreviewFile({
                          url: fileUrl,
                          name: fileName || "File",
                          type: "image",
                        });
                      } else {
                        window.open(fileUrl, "_blank");
                      }
                    }}
                  >
                    {/* Thumbnail / Icon */}
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fileUrl}
                        alt={fileName}
                        className="h-full w-full object-cover transition-transform group-hover/file:scale-110"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-muted/20">
                        {isPdf ? (
                          <span className="text-[8px] font-bold text-red-500">
                            PDF
                          </span>
                        ) : isWord ? (
                          <span className="text-[8px] font-bold text-blue-500">
                            DOC
                          </span>
                        ) : isExcel ? (
                          <span className="text-[8px] font-bold text-green-500">
                            XLS
                          </span>
                        ) : isPpt ? (
                          <span className="text-[8px] font-bold text-orange-500">
                            PPT
                          </span>
                        ) : isZip ? (
                          <span className="text-[8px] font-bold text-yellow-500">
                            ZIP
                          </span>
                        ) : (
                          <FileIcon className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <Eye className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                );
              })}
              {files.length > 4 && (
                <div
                  className={cn(
                    "flex items-center justify-center rounded bg-muted/30 border text-[9px] text-muted-foreground",
                    isCompact ? "h-6 w-6" : "h-9 w-9"
                  )}
                >
                  +{files.length - 4}
                </div>
              )}
            </div>

            <Dialog
              open={!!previewFile}
              onOpenChange={(open) => !open && setPreviewFile(null)}
            >
              <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none text-white sm:max-w-screen-lg">
                <DialogTitle className="sr-only">
                  Preview {previewFile?.name}
                </DialogTitle>
                <div className="relative flex flex-col items-center justify-center w-full h-full">
                  {/* Close button handled by Dialog primitive, but we can add a custom one if needed. 
                       Clicking outside closes it. */}
                  {previewFile?.type === "image" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      className="max-h-[85vh] w-auto object-contain rounded-md shadow-2xl"
                    />
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white/90">
                    {previewFile?.name}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        );

      case "rating":
        const ratingValue = Number(value || 0);
        return (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "h-3 w-3",
                  s <= ratingValue
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        );

      case "progress":
        const progressValue = Math.min(100, Math.max(0, Number(value || 0)));
        return (
          <div className="flex items-center gap-2 w-full min-w-[60px]">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all overflow-hidden"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-6">
              {progressValue}%
            </span>
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
