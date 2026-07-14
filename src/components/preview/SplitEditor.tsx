import React from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, previewClassName, editorRatio = 0.4 }: SplitEditorProps) {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;

  return (
    <div className="flex flex-col md:flex-row w-full h-full min-h-[400px] border border-dash-border rounded-xl overflow-hidden bg-dash-surface">
      <div
        className="border-b md:border-b-0 md:border-r border-dash-border bg-dash-surface overflow-y-auto scrollbar-thin"
        style={{ width: editorWidth, minWidth: 0, flex: `0 0 ${editorWidth}` }}
      >
        <div className="p-4">
          {editor}
        </div>
      </div>
      <div
        className={cn("overflow-y-auto scrollbar-thin bg-dash-bg", previewClassName)}
        style={{ width: previewWidth, minWidth: 0, flex: `0 0 ${previewWidth}` }}
      >
        {preview}
      </div>
    </div>
  );
}
