import React from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  /** Content for the editor (left) column */
  editor: React.ReactNode;
  /** Content for the preview (right) column */
  preview: React.ReactNode;
  /** Optional className to apply to the preview pane */
  previewClassName?: string;
  /** Ratio of editor width (0–1). Default 0.5 (50/50 split). */
  editorRatio?: number;
}

export function SplitEditor({
  editor,
  preview,
  previewClassName,
  editorRatio = 0.5,
}: SplitEditorProps) {
  const clamped = Math.min(1, Math.max(0, editorRatio));
  const editorPct = `${clamped * 100}%`;
  const previewPct = `${(1 - clamped) * 100}%`;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Editor pane */}
      <div
        className="h-full overflow-y-auto border-r border-dash-border bg-dash-surface"
        style={{ width: editorPct }}
      >
        {editor}
      </div>
      {/* Preview pane */}
      <div
        className={cn(
          "h-full overflow-y-auto bg-dash-bg",
          previewClassName
        )}
        style={{ width: previewPct }}
      >
        {preview}
      </div>
    </div>
  );
}

export default SplitEditor;
