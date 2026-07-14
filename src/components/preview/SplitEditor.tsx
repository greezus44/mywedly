import React from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, previewClassName, editorRatio = 0.5 }: SplitEditorProps) {
  const editorFlex = editorRatio;
  const previewFlex = 1 - editorRatio;
  return (
    <div className="flex h-full w-full flex-col gap-4 lg:flex-row">
      <div
        className="flex flex-col overflow-y-auto scrollbar-thin"
        style={{ flex: `${editorFlex} 1 0%`, minHeight: "200px" }}
      >
        {editor}
      </div>
      <div
        className={cn(
          "flex flex-col overflow-y-auto scrollbar-thin rounded-lg border border-dash-border bg-dash-surface",
          previewClassName
        )}
        style={{ flex: `${previewFlex} 1 0%`, minHeight: "200px" }}
      >
        {preview}
      </div>
    </div>
  );
}
