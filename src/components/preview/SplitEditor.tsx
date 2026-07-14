import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({
  editor,
  preview,
  previewClassName,
  editorRatio = 0.5,
}: SplitEditorProps) {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border border-border">
      <div
        className="flex flex-col overflow-y-auto border-r border-border bg-surface-alt"
        style={{ width: editorWidth }}
      >
        {editor}
      </div>
      <div
        className={cn(
          "flex flex-col overflow-y-auto bg-surface",
          previewClassName
        )}
        style={{ width: previewWidth }}
      >
        {preview}
      </div>
    </div>
  );
}
