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
    <div className="flex h-full w-full overflow-hidden rounded-lg border border-dash-border bg-dash-surface">
      <div
        className="flex flex-col overflow-y-auto scrollbar-thin border-r border-dash-border"
        style={{ width: editorWidth, minWidth: editorWidth }}
      >
        <div className="sticky top-0 z-10 border-b border-dash-border bg-dash-bg/80 px-4 py-2 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-dash-text">Editor</h3>
        </div>
        <div className="flex-1 p-4">{editor}</div>
      </div>
      <div
        className={cn("flex flex-col overflow-y-auto scrollbar-thin", previewClassName)}
        style={{ width: previewWidth, minWidth: previewWidth }}
      >
        <div className="sticky top-0 z-10 border-b border-dash-border bg-dash-bg/80 px-4 py-2 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-dash-text">Preview</h3>
        </div>
        <div className="flex-1 p-4">{preview}</div>
      </div>
    </div>
  );
}
