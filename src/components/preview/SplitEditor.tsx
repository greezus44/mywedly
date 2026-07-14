import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  previewClassName?: string;
  editorRatio?: number;
}

export function SplitEditor({ editor, preview, previewClassName, editorRatio = 0.4 }: SplitEditorProps) {
  const editorWidth = `${editorRatio * 100}%`;
  const previewWidth = `${(1 - editorRatio) * 100}%`;
  return (
    <div className="flex h-full min-h-0 w-full flex-col md:flex-row">
      <div
        className="min-h-0 shrink-0 overflow-y-auto border-b border-dash-border md:border-b-0 md:border-r"
        style={{ width: editorWidth }}
      >
        <div className="p-4">{editor}</div>
      </div>
      <div
        className={cn("min-h-0 flex-1 overflow-y-auto bg-dash-bg", previewClassName)}
        style={{ width: previewWidth }}
      >
        {preview}
      </div>
    </div>
  );
}
