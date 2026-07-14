import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  previewClassName?: string;
  editorRatio?: number; // 0-1, fraction of width for editor (default 0.5)
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
    <div className="flex h-full w-full overflow-hidden rounded-lg border border-dash-border bg-dash-surface">
      <div
        className="h-full overflow-y-auto border-r border-dash-border p-4 scrollbar-thin"
        style={{ width: editorWidth, flexShrink: 0 }}
      >
        {editor}
      </div>
      <div
        className={cn("h-full overflow-y-auto scrollbar-thin", previewClassName)}
        style={{ width: previewWidth, flexShrink: 0 }}
      >
        {preview}
      </div>
    </div>
  );
}

export default SplitEditor;
