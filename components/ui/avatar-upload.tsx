"use client";

import { useCallback, useState, useEffect } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import {
  AlertCircle,
  ImageIcon,
  Upload,
  X,
  Pencil,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getProxyImageUrl } from "@/lib/utils";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface AvatarUploadProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // set canvas size to match the bounding box
  canvas.width = image.width;
  canvas.height = image.height;

  // draw image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      resolve(file);
    }, "image/jpeg");
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });
}

export function AvatarUpload({
  value,
  onChange,
  onRemove,
  maxSize = 2 * 1024 * 1024, // 2MB default
  disabled = false,
  className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(() => {
    if (typeof value === "string") return value;
    if (value instanceof File) return URL.createObjectURL(value);
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const [aspect, setAspect] = useState(1);

  // Crop state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Update preview when value changes (e.g. initial load or reset)
  useEffect(() => {
    if (typeof value === "string") {
      setPreview(value);
    } else if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [value]);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleDragDrop = useCallback(
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
        // Just update the value effectively, don't open editor automatically
        const file = acceptedFiles[0];
        onChange(file);

        // We don't set imageToCrop/open editor here anymore per user request
      }
    },
    [maxSize, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDragDrop,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
    },
    maxSize,
    maxFiles: 1,
    multiple: false,
    disabled,
    noClick: !!preview, // Disable click to upload if preview exists (use edit button instead)
  });

  const handleSaveCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImage) {
        onChange(croppedImage);
        // Preview will update via useEffect above once parent passes back the file or we can set it locally if needed
        // Since parent updates 'value', standard flow handles it.
        // But for smoother UX, let's update local preview too if value doesn't update immediately
        // Actually, best to rely on value prop.

        // Close editor
        setIsEditorOpen(false);
        setImageToCrop(null);
      }
    } catch (e) {
      console.error(e);
      setError(
        `Failed to crop image: ${
          e instanceof Error ? e.message : "Unknown error"
        }`
      );
    }
  };

  const handleEditClick = async () => {
    if (preview) {
      // Logic to handle remote URLs via proxy to avoid CORS
      if (
        typeof preview === "string" &&
        (preview.startsWith("http") || preview.startsWith("https"))
      ) {
        try {
          // Create a proxy URL using the rewrite we defined in next.config.ts
          // Replaces the backend origin with our local proxy path
          const fetchUrl = getDisplayUrl(preview);

          const response = await fetch(fetchUrl);
          if (!response.ok) throw new Error("Network response was not ok");

          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageToCrop(objectUrl);
          setIsEditorOpen(true);
          setZoom(1);
          setCrop({ x: 0, y: 0 });
          setAspect(1); // Reset aspect ratio
        } catch (e) {
          console.error("Failed to fetch image for cropping:", e);
          // Fallback: try using the original URL directly (might work if CORS is actually set)
          try {
            // Second attempt with mode 'no-cors' just to see (won't work for blob access though)
            // Just show error
            setError(
              "Failed to load full image due to security/CORS restrictions."
            );
          } catch {}
        }
      } else {
        // Local file or blob URL
        setImageToCrop(preview);
        setIsEditorOpen(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setAspect(1);
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange(null);
    if (onRemove) {
      onRemove();
    }
  };

  // Helper function to handle image URLs and CORS proxying
  const getDisplayUrl = (url: string | null) => {
    return getProxyImageUrl(url);
  };

  return (
    <>
      <div className={cn("flex flex-col gap-2 w-full", className)}>
        <div className="relative group">
          {/* Drop area */}
          <div
            {...getRootProps()}
            className={cn(
              "relative flex min-h-52 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
              "border-input hover:bg-accent/50",
              isDragActive && "bg-accent/50 border-ring",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disabled && "opacity-50 cursor-not-allowed",
              preview ? "border-solid" : "", // Solid border if image present
              className
            )}
          >
            <input {...getInputProps()} aria-label="Upload avatar image" />

            {preview ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 w-full h-full">
                {/* Using standard img tag to avoid Next.js domain config issues during dev */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getDisplayUrl(preview)}
                  alt="Avatar preview"
                  className="h-full w-full object-contain rounded-xl"
                />

                {/* Overlay actions */}
                {!disabled && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick();
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-3 text-center pointer-events-none">
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
                  className="mt-4 pointer-events-auto"
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

      {/* Cropping Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-80 bg-black rounded-md overflow-hidden">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          {/* Aspect Ratio Controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant={aspect === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(1)}
              className="text-xs h-7"
            >
              1:1
            </Button>
            <Button
              variant={aspect === 4 / 3 ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(4 / 3)}
              className="text-xs h-7"
            >
              4:3
            </Button>
            <Button
              variant={aspect === 16 / 9 ? "default" : "outline"}
              size="sm"
              onClick={() => setAspect(16 / 9)}
              className="text-xs h-7"
            >
              16:9
            </Button>
          </div>

          <div className="py-2 flex items-center gap-4">
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(val) => setZoom(val[0])}
              className="flex-1"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditorOpen(false);
                setImageToCrop(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCrop}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
