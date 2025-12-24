"use client";

import { useCallback, useState } from "react";
import NextImage from "next/image";
import { type FileRejection, useDropzone } from "react-dropzone";
import { AlertCircle, ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

export function AvatarUpload({
  value,
  onChange,
  onRemove,
  maxSize = 2 * 1024 * 1024, // 2MB default
  disabled = false,
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : null
  );
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError(`File is too large. Max size is ${maxSize / 1024 / 1024}MB`);
        } else if (rejection.errors[0]?.code === "file-invalid-type") {
          setError(
            "Invalid file type. Only JPEG, PNG, JPG, and GIF are allowed"
          );
        } else {
          setError(rejection.errors[0]?.message || "Invalid file");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Create preview URL
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Call onChange with the file
        onChange(file);

        // Cleanup old preview URL
        return () => URL.revokeObjectURL(objectUrl);
      }
    },
    [onChange, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
    },
    maxSize,
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange(null);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative">
        {/* Drop area */}
        <div
          {...getRootProps()}
          className={cn(
            "relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
            "border-input hover:bg-accent/50",
            isDragActive && "bg-accent/50 border-ring",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <input {...getInputProps()} aria-label="Upload avatar image" />

          {preview ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <NextImage
                src={preview}
                alt="Avatar preview"
                fill
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
              <div
                className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                aria-hidden="true"
              >
                <ImageIcon className="size-4 opacity-60" />
              </div>
              <p className="mb-1.5 text-sm font-medium">
                {isDragActive ? "Drop image here" : "Drop your image here"}
              </p>
              <p className="text-muted-foreground text-xs">
                JPEG, PNG, JPG or GIF (max. {maxSize / 1024 / 1024}MB)
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                disabled={disabled}
              >
                <Upload
                  className="-ms-1 size-4 opacity-60"
                  aria-hidden="true"
                />
                Select image
              </Button>
            </div>
          )}
        </div>

        {/* Remove button */}
        {preview && !disabled && (
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={handleRemove}
              className={cn(
                "z-50 flex size-8 cursor-pointer items-center justify-center rounded-full",
                "bg-black/60 text-white transition-colors hover:bg-black/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Remove image"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          className="text-destructive flex items-center gap-1 text-xs"
          role="alert"
        >
          <AlertCircle className="size-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
