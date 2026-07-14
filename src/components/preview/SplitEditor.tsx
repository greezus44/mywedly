import React from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export const SplitEditor: React.FC<SplitEditorProps> = ({
  editor,
  preview,
  previewClassName,
  editorRatio = 0.5,
}) => {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border border-dash-border">
      <div
        className="overflow-y-auto border-r border-dash-border bg-dash-surface p-4 scrollbar-thin"
        style={{ width: editorWidth, minWidth: "320px" }}
      >
        {editor}
      </div>
      <div
        className={cn("overflow-y-auto bg-dash-bg scrollbar-thin", previewClassName)}
        style={{ width: previewWidth, minWidth: "320px" }}
      >
        {preview}
      </div>
    </div>
  );
};
