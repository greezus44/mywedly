import { type ReactNode } from "react";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
}

export function SplitEditor({ editor, preview }: SplitEditorProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="order-2 lg:order-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-dash-muted">Editor</div>
        <div className="space-y-4">{editor}</div>
      </div>
      <div className="order-1 lg:order-2">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-dash-muted">Live Preview</div>
        <div className="overflow-hidden rounded-lg border border-dash-border">{preview}</div>
      </div>
    </div>
  );
}
