import React from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({
  editor,
  preview,
  previewClassName,
  editorRatio = 0.4,
}: SplitEditorProps) {
  const editorStyle: React.CSSProperties = {
    flexBasis: `${editorRatio * 100}%`,
  };
  const previewStyle: React.CSSProperties = {
    flexBasis: `${(1 - editorRatio) * 100}%`,
  };

  return (
    <div className="flex h-full w-full flex-col gap-4 lg:flex-row">
      <div
        className={cn(
          "min-h-0 overflow-y-auto rounded-lg border border-dash-border bg-dash-surface p-4 scrollbar-thin",
          "lg:max-h-full"
        )}
        style={editorStyle}
      >
        {editor}
      </div>
      <div
        className={cn(
          "min-h-0 overflow-y-auto rounded-lg border border-dash-border bg-dash-bg p-4 scrollbar-thin",
          previewClassName
        )}
        style={previewStyle}
      >
        {preview}
      </div>
    </div>
  );
}
