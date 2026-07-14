import { type ReactNode } from "react";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
}

export function SplitEditor({ editor, preview }: SplitEditorProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Editor</h3>
        {editor}
      </div>
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Live Preview</h3>
        {preview}
      </div>
    </div>
  );
}
