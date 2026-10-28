import { type ReactNode } from "react";
import { usePreviewLanguage, type PreviewDevice } from "./preview-language";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
}

const DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  phone: "390px",
  tablet: "768px",
  laptop: "100%",
};

const DEVICE_LABELS: Record<PreviewDevice, string> = {
  phone: "Phone",
  tablet: "Tablet",
  laptop: "Laptop",
};

export function SplitEditor({ editor, preview }: SplitEditorProps) {
  const { language, toggle, device, setDevice } = usePreviewLanguage();
  const previewWidth = DEVICE_WIDTHS[device];
  const isResponsive = device !== "laptop";
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="order-2 lg:order-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-dash-muted">Editor</div>
        <div className="space-y-4">{editor}</div>
      </div>
      <div className="order-1 lg:order-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-dash-muted">
          <span>Live Preview</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border border-dash-border bg-dash-surface p-0.5">
              {(Object.keys(DEVICE_LABELS) as PreviewDevice[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    device === d ? "bg-dash-primary text-white" : "text-dash-muted hover:text-dash-text"
                  }`}
                >
                  {DEVICE_LABELS[d]}
                </button>
              ))}
            </div>
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
        <div className="lg:sticky lg:top-4 overflow-y-auto overflow-x-auto rounded-lg border border-dash-border max-h-[70vh] lg:max-h-[75vh] shadow-sm bg-dash-bg/30 p-2 flex justify-center">
          <div
            className="rounded-md overflow-y-auto overflow-x-hidden bg-white transition-all duration-300 ease-out"
            style={{ width: previewWidth, maxWidth: "100%", maxHeight: "calc(75vh - 16px)" }}
          >
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
