import { type ReactNode } from "react";
import { usePreviewLanguage, type PreviewDevice } from "./preview-language";

interface SplitEditorProps {
  editor: ReactNode;
  preview: ReactNode;
}

const DEVICE_CONFIG: Record<PreviewDevice, { width: string; label: string }> = {
  phone: { width: "402px", label: "Phone" },
  tablet: { width: "834px", label: "Tablet" },
  laptop: { width: "100%", label: "Laptop" },
};

export function SplitEditor({ editor, preview }: SplitEditorProps) {
  const { language, toggle, device, setDevice } = usePreviewLanguage();
  const { width: previewWidth, label: deviceLabel } = DEVICE_CONFIG[device];
  const isPhone = device === "phone";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Editor column */}
      <div className="order-2 lg:order-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-dash-muted">Editor</div>
        <div className="space-y-4">{editor}</div>
      </div>

      {/* Preview column — entire column sticks so header buttons stay visible while scrolling */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden flex flex-col">
        {/* Sticky toolbar: device toggle + language toggle */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-dash-muted shrink-0">
          <span>Live Preview</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border border-dash-border bg-dash-surface p-0.5">
              {(Object.keys(DEVICE_CONFIG) as PreviewDevice[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    device === d ? "bg-dash-primary text-white" : "text-dash-muted hover:text-dash-text"
                  }`}
                >
                  {DEVICE_CONFIG[d].label}
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

        {/* Scrollable preview area */}
        <div className="flex-1 overflow-hidden rounded-lg border border-dash-border bg-dash-bg/30 p-3 flex justify-center items-stretch h-[600px] lg:h-auto" style={{ minHeight: "200px" }}>
          {isPhone ? (
            /* iPhone 17 Pro frame: dark bezel, rounded corners, Dynamic Island */
            <div
              className="relative shrink-0 bg-neutral-900 transition-all duration-300 ease-out flex flex-col"
              style={{
                width: "426px",
                maxWidth: "100%",
                borderRadius: "55px",
                padding: "12px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
              }}
            >
              {/* Dynamic Island */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full"
                style={{ top: "20px", width: "120px", height: "34px", zIndex: 10 }}
              />
              {/* Screen */}
              <div
                className="overflow-y-auto overflow-x-hidden flex-1"
                style={{
                  width: "402px",
                  maxWidth: "100%",
                  borderRadius: "44px",
                  minHeight: "300px",
                }}
              >
                {preview}
              </div>
            </div>
          ) : (
            <div
              className="rounded-md overflow-y-auto overflow-x-hidden transition-all duration-300 ease-out h-full"
              style={{ width: previewWidth, maxWidth: "100%", minHeight: "300px" }}
            >
              {preview}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
