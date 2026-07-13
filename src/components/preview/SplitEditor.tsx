import { type ReactNode, useState } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "../../lib/utils";

export type DeviceType = "desktop" | "tablet" | "mobile";

export function SplitEditor({
  children,
  preview,
  device: deviceProp,
  onDeviceChange,
}: {
  children: ReactNode;
  preview: (device: DeviceType) => ReactNode;
  device?: DeviceType;
  onDeviceChange?: (d: DeviceType) => void;
}) {
  const [internalDevice, setInternalDevice] = useState<DeviceType>("desktop");
  const device = deviceProp || internalDevice;
  const setDevice = (d: DeviceType) => {
    if (onDeviceChange) onDeviceChange(d);
    else setInternalDevice(d);
  };

  const widths: Record<DeviceType, string> = { desktop: "100%", tablet: "768px", mobile: "375px" };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <div className="flex-1 lg:max-w-md overflow-y-auto lg:pr-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
        {children}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition", device === d ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-gray-300 text-gray-600 hover:bg-gray-50")}
            >
              <Icon className="h-4 w-4" /> {d}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <div className="mx-auto transition-all duration-300" style={{ maxWidth: widths[device] }}>
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white" style={{ minHeight: "500px" }}>
              {preview(device)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
