"use client";

import { useRef } from "react";
import {
  useUserAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from "@/lib/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileIcon, Trash2, UploadCloud, Dot } from "lucide-react";
import { toast } from "sonner";

interface AttachmentsSectionProps {
  userId: string;
}

export function AttachmentsSection({ userId }: AttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments, isLoading } = useUserAttachments(userId);
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Max 10MB allowed.");
      return;
    }

    try {
      await uploadMutation.mutateAsync({ id: userId, file });
    } catch {
      // handled in hook
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (mediaId: number) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    await deleteMutation.mutateAsync({ id: userId, mediaId });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Attachments</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              Upload File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : attachments?.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No attachments yet.</p>
            <Button
              variant="link"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload one?
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments?.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-md border group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 rounded bg-background flex items-center justify-center border">
                    <FileIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {file.file_name}
                    </span>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <Dot className="h-3 w-3" />
                      <span>{file.created_at}</span>
                      <Dot className="h-3 w-3" />
                      <span>{file.uploaded_by}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
