import { type ReactNode } from "react";
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
  const editorPct = `${Math.round(editorRatio * 100)}%`;
  const previewPct = `${Math.round((1 - editorRatio) * 100)}%`;

  return (
    <div className="flex h-full w-full flex-col lg:flex-row">
      <div
        className="overflow-y-auto border-b border-dash-border lg:border-b-0 lg:border-r scrollbar-thin"
        style={{ height: "100%", flexBasis: editorPct }}
      >
        <div className="p-4 lg:p-6">{editor}</div>
      </div>
      <div
        className={cn(
          "overflow-y-auto scrollbar-thin bg-dash-bg",
          previewClassName
        )}
        style={{ height: "100%", flexBasis: previewPct }}
      >
        {preview}
      </div>
    </div>
  );
}
