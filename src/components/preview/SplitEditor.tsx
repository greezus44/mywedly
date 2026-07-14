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
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      <div style={{ width: editorWidth }} className="w-full lg:w-auto">
        {editor}
      </div>
      <div style={{ width: previewWidth }} className={cn("w-full lg:w-auto", previewClassName)}>
        {preview}
      </div>
    </div>
  );
}
