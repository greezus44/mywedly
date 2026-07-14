import React from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number; // 0..1, fraction of width for editor; rest goes to preview
}

export const SplitEditor: React.FC<SplitEditorProps> = ({
  editor,
  preview,
  previewClassName,
  editorRatio = 0.5,
}) => {
  const editorBasis = `${Math.round(editorRatio * 100)}%`;
  const previewBasis = `${Math.round((1 - editorRatio) * 100)}%`;
  return (
    <div className="flex h-full w-full flex-col gap-4 lg:flex-row">
      <div
        style={{ flexBasis: editorBasis }}
        className="min-h-0 flex-1 overflow-auto rounded-lg border border-dash-border bg-dash-surface p-4"
      >
        {editor}
      </div>
      <div
        style={{ flexBasis: previewBasis }}
        className={cn(
          "min-h-0 flex-1 overflow-auto rounded-lg border border-dash-border bg-dash-bg",
          previewClassName,
        )}
      >
        {preview}
      </div>
    </div>
  );
};
