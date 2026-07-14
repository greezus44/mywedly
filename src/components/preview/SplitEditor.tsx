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
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;

  return (
    <div className="flex h-full min-h-0">
      <div
        className="overflow-y-auto scrollbar-thin border-r border-dash-border bg-dash-surface"
        style={{ width: editorWidth, flexShrink: 0 }}
      >
        {editor}
      </div>
      <div
        className={cn("overflow-y-auto scrollbar-thin bg-dash-bg", previewClassName)}
        style={{ width: previewWidth, flexGrow: 1 }}
      >
        {preview}
      </div>
    </div>
  );
}
