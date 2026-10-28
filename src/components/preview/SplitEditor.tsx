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
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-dash-muted">
          <span>Live Preview</span>
          <span className="text-dash-muted/60 normal-case font-normal">Scroll to see more</span>
        </div>
        <div className="lg:sticky lg:top-4 overflow-y-auto overflow-x-hidden rounded-lg border border-dash-border max-h-[70vh] lg:max-h-[75vh] shadow-sm">{preview}</div>
      </div>
    </div>
  );
}
