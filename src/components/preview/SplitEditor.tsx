import { type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
  className?: string;
  editorClassName?: string;
  previewClassName?: string;
}

export function SplitEditor({
  editor,
  preview,
  className,
  editorClassName,
  previewClassName,
}: SplitEditorProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", className)}>
      <div className={cn("overflow-y-auto scrollbar-thin", editorClassName)}>
        {editor}
      </div>
      <div className={cn("overflow-y-auto scrollbar-thin", previewClassName)}>
        {preview}
      </div>
    </div>
  );
}
