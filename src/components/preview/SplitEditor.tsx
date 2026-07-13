import { useState, ReactNode, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Monitor, Tablet, Smartphone } from "lucide-react";

interface SplitEditorProps {
  title: string;
  preview: ReactNode;
  previewKey?: string;
  children: ReactNode;
}

type Device = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function SplitEditor({ title, preview, previewKey = "0", children }: SplitEditorProps) {
  const [device, setDevice] = useState<Device>("desktop");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const el = document.getElementById("split-editor-preview");
    if (el) el.scrollTop = scrollY;
  }, [previewKey, scrollY]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="order-2 lg:order-1">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="p-5 max-h-[600px] overflow-y-auto">{children}</div>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
            <div className="flex items-center gap-1">
              {(["desktop", "tablet", "mobile"] as Device[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={cn("p-1.5 rounded-lg transition-colors", device === d ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-100")}
                >
                  {d === "desktop" ? <Monitor className="w-4 h-4" /> : d === "tablet" ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-4 flex justify-center max-h-[600px] overflow-y-auto" onScroll={(e) => setScrollY((e.target as HTMLElement).scrollTop)}>
            <div
              id="split-editor-preview"
              key={previewKey}
              className="bg-white rounded-lg shadow-sm transition-all duration-300 overflow-hidden"
              style={{ width: deviceWidths[device], maxWidth: "100%" }}
            >
              {preview}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
