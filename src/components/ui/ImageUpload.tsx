import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { Button } from "./Button";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  eventId: string;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "wide" | "tall" | "auto";
  maxSizeMb?: number;
  disabled?: boolean;
}

const aspectClasses: Record<NonNullable<ImageUploadProps["aspectRatio"]>, string> = {
  square: "aspect-square",
  wide: "aspect-[16/9]",
  tall: "aspect-[3/4]",
  auto: "aspect-auto min-h-[120px]",
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder,
  eventId,
  label,
  className,
  aspectRatio = "wide",
  maxSizeMb = 10,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        setError(`File too large. Max ${maxSizeMb}MB.`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setUploading(true);
      try {
        // remove existing image if replacing
        if (value) {
          const existingPath = extractPathFromUrl(value);
          if (existingPath) {
            removeImage(value).catch(() => {});
          }
        }
        const url = await uploadImage(file, folder, eventId);
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [eventId, folder, maxSizeMb, onChange, value],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so selecting the same file again still fires
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onRemove = () => {
    if (value) {
      removeImage(value).catch(() => {});
    }
    onChange(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectClasses[aspectRatio],
          dragOver ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-bg",
          disabled && "opacity-50",
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={onRemove}
                  disabled={uploading}
                >
                  Remove
                </Button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-dash-muted hover:text-dash-text"
          >
            {uploading ? (
              <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Click or drag to upload</span>
                <span className="text-xs">PNG, JPG, SVG up to {maxSizeMb}MB</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};
