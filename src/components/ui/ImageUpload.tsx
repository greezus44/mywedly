import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { Button } from "./Button";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  pathPrefix: string;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "wide" | "tall" | "auto";
}

const aspectClasses: Record<string, string> = {
  square: "aspect-square",
  wide: "aspect-video",
  tall: "aspect-[3/4]",
  auto: "min-h-[120px]",
};

export function ImageUpload({
  value,
  onChange,
  pathPrefix,
  label,
  className,
  aspectRatio = "wide",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setUploading(true);
      // Remove existing image first
      if (value) {
        const oldPath = extractPathFromUrl(value);
        if (oldPath) await removeImage(oldPath);
      }
      const result = await uploadImage(file, pathPrefix);
      setUploading(false);
      if (result) {
        onChange(result.url);
      } else {
        setError("Failed to upload image. Please try again.");
      }
    },
    [onChange, pathPrefix, value]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    if (value) {
      const path = extractPathFromUrl(value);
      if (path) await removeImage(path);
    }
    onChange(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed transition-colors",
          dragOver
            ? "border-dash-primary bg-dash-primary/5"
            : "border-dash-border hover:border-dash-primary/50",
          aspectClasses[aspectRatio],
          "flex items-center justify-center overflow-hidden"
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center px-4 py-8">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
                <p className="text-sm text-dash-muted">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="h-10 w-10 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-sm text-dash-text font-medium">Drag & drop or click to upload</p>
                <p className="text-xs text-dash-muted">PNG, JPG, SVG up to 5MB</p>
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      {error && <p className="text-sm text-dash-danger">{error}</p>}
      {value && (
        <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
          Remove image
        </Button>
      )}
    </div>
  );
}
