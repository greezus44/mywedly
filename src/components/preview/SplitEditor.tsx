import React from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, previewClassName, editorRatio = 0.5 }: SplitEditorProps) {
  const editorFlex = editorRatio;
  const previewFlex = 1 - editorRatio;

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div
        className="overflow-auto rounded-lg border border-dash-border bg-dash-surface"
        style={{ flex: `${editorFlex} 1 0` }}
      >
        {editor}
      </div>
      <div
        className={cn("overflow-auto rounded-lg border border-dash-border bg-dash-surface", previewClassName)}
        style={{ flex: `${previewFlex} 1 0` }}
      >
        {preview}
      </div>
    </div>
  );
}
