import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, previewClassName, editorRatio = 1 }: SplitEditorProps) {
  const totalRatio = editorRatio + 1;
  const editorWidth = `${(editorRatio / totalRatio) * 100}%`;
  const previewWidth = `${(1 / totalRatio) * 100}%`;

  return (
    <div className="flex h-full min-h-[600px] gap-0 overflow-hidden rounded-lg border border-dash-border">
      <div
        className="overflow-y-auto scrollbar-thin bg-dash-surface p-4"
        style={{ width: editorWidth, flexShrink: 0 }}
      >
        {editor}
      </div>
      <div
        className={cn(
          "overflow-y-auto scrollbar-thin border-l border-dash-border bg-dash-bg",
          previewClassName
        )}
        style={{ width: previewWidth, flexShrink: 0 }}
      >
        {preview}
      </div>
    </div>
  );
}
