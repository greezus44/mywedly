import { useState, type ReactNode } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "../../lib/utils";

export type DeviceType = "desktop" | "tablet" | "mobile";

export interface SplitEditorProps {
  preview: ReactNode;
  children: ReactNode;
}

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
      <div className="overflow-y-auto rounded-lg border border-gray-200 bg-white">
        {children}
      </div>

      {/* Preview panel */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {/* Device toolbar */}
        <div className="flex items-center justify-center gap-1 border-b border-gray-200 bg-white px-4 py-2">
          {(
            [
              { type: "desktop", icon: Monitor, label: "Desktop" },
              { type: "tablet", icon: Tablet, label: "Tablet" },
              { type: "mobile", icon: Smartphone, label: "Mobile" },
            ] as const
          ).map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setDevice(type)}
              title={label}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-2 transition-colors",
                device === type
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="mx-auto transition-all duration-300"
            style={{
              maxWidth: deviceWidths[device],
              width: "100%",
            }}
          >
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {preview}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
