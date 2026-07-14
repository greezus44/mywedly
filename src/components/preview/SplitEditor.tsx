import type { ReactNode } from "react";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
}

export function SplitEditor({ editor, preview }: SplitEditorProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        {editor}
      </div>
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        {preview}
      </div>
    </div>
  );
}
