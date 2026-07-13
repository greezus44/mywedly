import React, { useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  preview: React.ReactNode;
  children: React.ReactNode;
}

type DeviceType = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<DeviceType, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export function SplitEditor({ preview, children }: SplitEditorProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");

  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Editor panel */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Editor
          </span>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>

      {/* Preview panel */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Preview
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDevice("desktop")}
              className={cn(
                "rounded p-1.5 transition-colors",
                device === "desktop"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-200"
              )}
              title="Desktop view"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={cn(
                "rounded p-1.5 transition-colors",
                device === "tablet"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-200"
              )}
              title="Tablet view"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={cn(
                "rounded p-1.5 transition-colors",
                device === "mobile"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-200"
              )}
              title="Mobile view"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-start justify-center overflow-auto p-4">
          <div
            className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all"
            style={{ width: deviceWidths[device], maxWidth: "100%" }}
          >
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
