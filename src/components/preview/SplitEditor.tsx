import React from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, previewClassName, editorRatio = 0.5 }: SplitEditorProps) {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;

  return (
    <div className="flex h-full min-h-[400px] w-full overflow-hidden rounded-lg border border-dash-border">
      <div
        className="h-full overflow-y-auto scrollbar-thin border-r border-dash-border bg-dash-surface p-4"
        style={{ width: editorWidth, flexShrink: 0 }}
      >
        {editor}
      </div>
      <div
        className={cn("h-full overflow-y-auto scrollbar-thin bg-dash-bg", previewClassName)}
        style={{ width: previewWidth, flexShrink: 0 }}
      >
        {preview}
      </div>
    </div>
  );
}
