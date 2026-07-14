import React from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({
  editor,
  preview,
  previewClassName,
  editorRatio = 0.5,
}: SplitEditorProps) {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div
        className="h-full overflow-y-auto scrollbar-thin border-r border-dash-border bg-dash-bg p-4"
        style={{ width: editorWidth, flexShrink: 0 }}
      >
        {editor}
      </div>
      <div
        className={cn(
          "h-full overflow-y-auto scrollbar-thin bg-dash-surface",
          previewClassName
        )}
        style={{ width: previewWidth, flexGrow: 1 }}
      >
        {preview}
      </div>
    </div>
  );
}
