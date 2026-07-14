import React from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, previewClassName, editorRatio = 1 }: SplitEditorProps) {
  const previewRatio = 2 - editorRatio;
  const editorWidth = `${(editorRatio / 2) * 100}%`;
  const previewWidth = `${(previewRatio / 2) * 100}%`;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border border-dash-border bg-dash-surface">
      <div
        className="h-full overflow-y-auto scrollbar-thin border-r border-dash-border p-4"
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
