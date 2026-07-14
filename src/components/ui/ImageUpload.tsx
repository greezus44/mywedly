import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "./index";
import { uploadImage } from "../../lib/upload";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  pathPrefix: string;
  label?: string;
  className?: string;
  aspectRatio?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  bucket,
  pathPrefix,
  label,
  className,
  aspectRatio = "aspect-video",
}) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      const result = await uploadImage(file, bucket, pathPrefix);
      setLoading(false);
      if ("error" in result) {
        setError(result.error);
      } else {
        onChange(result.url);
      }
    },
    [bucket, pathPrefix, onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectRatio,
          dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border hover:border-dash-primary/50",
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-dash-text hover:bg-white"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="rounded-md bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          </>
        ) : loading ? (
          <LoadingSpinner size={32} />
        ) : (
          <div className="px-4 text-center">
            <div className="mb-2 text-2xl">📷</div>
            <p className="text-sm text-dash-muted">
              Drag & drop or <span className="text-dash-primary">browse</span>
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  );
};
