import React from "react";
import { cn } from "../../lib/utils";

export function SplitEditor({
  editor,
  preview,
  previewClassName,
}: {
  editor: React.ReactNode;
  preview: React.ReactNode;
  previewClassName?: string;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">{editor}</div>
      <div className={cn("rounded-xl border border-dash-border overflow-hidden", previewClassName)}>
        {preview}
      </div>
    </div>
  );
}
