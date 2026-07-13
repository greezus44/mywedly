import React, { type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  className?: string;
  /** Ratio of editor width, 0-1 (default 0.4) */
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, className, editorRatio = 0.4 }: SplitEditorProps) {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;
  return (
    <div className={cn("flex h-full w-full gap-0 overflow-hidden", className)}>
      <div
        className="h-full overflow-y-auto scrollbar-thin border-r border-dash-border bg-dash-surface p-4"
        style={{ width: editorWidth, flexShrink: 0 }}
      >
        {editor}
      </div>
      <div
        className="h-full overflow-y-auto scrollbar-thin bg-dash-bg"
        style={{ width: previewWidth, flexGrow: 1 }}
      >
        {preview}
      </div>
    </div>
  );
}
