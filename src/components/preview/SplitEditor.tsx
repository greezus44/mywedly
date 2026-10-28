import { type ReactNode } from "react";
import { usePreviewLanguage } from "./preview-language";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
}

export function SplitEditor({ editor, preview }: SplitEditorProps) {
  const { language, toggle } = usePreviewLanguage();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="order-2 lg:order-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-dash-muted">Editor</div>
        <div className="space-y-4">{editor}</div>
      </div>
      <div className="order-1 lg:order-2">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-dash-muted">
          <span>Live Preview</span>
          <div className="flex items-center gap-3">
            <span className="text-dash-muted/60 normal-case font-normal">Scroll to see more</span>
            <div className="flex items-center rounded-md border border-dash-border bg-dash-surface p-0.5">
              <button
                type="button"
                onClick={language === "bm" ? toggle : undefined}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  language === "en" ? "bg-dash-primary text-white" : "text-dash-muted hover:text-dash-text"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={language === "en" ? toggle : undefined}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  language === "bm" ? "bg-dash-primary text-white" : "text-dash-muted hover:text-dash-text"
                }`}
              >
                BM
              </button>
            </div>
          </div>
        </div>
        <div className="lg:sticky lg:top-4 overflow-y-auto overflow-x-hidden rounded-lg border border-dash-border max-h-[70vh] lg:max-h-[75vh] shadow-sm">{preview}</div>
      </div>
    </div>
  );
}
