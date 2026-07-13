import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SplitEditorProps {
  preview: ReactNode;
  children: ReactNode;
}

type Device = "desktop" | "tablet" | "mobile";

const deviceSizes: Record<Device, { width: string; maxWidth: string }> = {
  desktop: { width: "100%", maxWidth: "100%" },
  tablet: { width: "768px", maxWidth: "100%" },
  mobile: { width: "375px", maxWidth: "100%" },
};

export function SplitEditor({ preview, children }: SplitEditorProps) {
  const [device, setDevice] = useState<Device>("desktop");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          Editor
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Preview
          </span>
          <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-0.5">
            {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium capitalize transition-colors",
                  device === d
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center overflow-auto">
          <div
            className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
            style={deviceSizes[device] as CSSProperties}
          >
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
