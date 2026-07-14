import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  /** Left panel: the editor form / controls */
  editor: ReactNode;
  /** Right panel: the live preview */
  preview: ReactNode;
  /** Ratio of the editor panel (out of 12). Default 5. */
  editorRatio?: number;
  className?: string;
  /** Optional header rendered above the editor panel */
  editorHeader?: ReactNode;
  /** Optional header rendered above the preview panel */
  previewHeader?: ReactNode;
}

// Pre-computed Tailwind classes for each possible ratio (avoids JIT purge issues)
const editorColClasses: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
};

const previewColClasses: Record<number, string> = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
};

/**
 * Two-column editor/preview layout. On small screens, stacks vertically
 * with the editor on top and the preview below.
 */
export function SplitEditor({
  editor,
  preview,
  editorRatio = 5,
  className,
  editorHeader,
  previewHeader,
}: SplitEditorProps) {
  const previewRatio = 12 - editorRatio;
  const editorClass = editorColClasses[editorRatio] ?? "lg:col-span-5";
  const previewClass = previewColClasses[previewRatio] ?? "lg:col-span-7";

  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-12", className)}>
      {/* Editor panel */}
      <div className={cn("flex flex-col rounded-lg border border-dash-border bg-dash-surface", editorClass)}>
        {editorHeader && (
          <div className="border-b border-dash-border px-4 py-3">
            {editorHeader}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {editor}
        </div>
      </div>

      {/* Preview panel */}
      <div className={cn("flex flex-col rounded-lg border border-dash-border bg-dash-surface", previewClass)}>
        {previewHeader && (
          <div className="border-b border-dash-border px-4 py-3">
            {previewHeader}
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {preview}
        </div>
      </div>
    </div>
  );
}
