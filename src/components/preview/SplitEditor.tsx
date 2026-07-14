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
}: SplitEditorProps): React.ReactElement {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;

  return (
    <div className="flex h-full min-h-[600px] w-full overflow-hidden rounded-lg border border-dash-border bg-dash-surface">
      <div
        className="h-full overflow-y-auto scrollbar-thin border-r border-dash-border bg-dash-surface"
        style={{ width: editorWidth }}
      >
        {editor}
      </div>
      <div
        className={cn("h-full overflow-y-auto scrollbar-thin", previewClassName)}
        style={{ width: previewWidth }}
      >
        {preview}
      </div>
    </div>
  );
}
