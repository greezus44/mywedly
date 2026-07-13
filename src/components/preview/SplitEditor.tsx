import { type ReactNode, useState, useCallback, useMemo } from "react";
import { Monitor, Tablet, Smartphone, Maximize2, Eye, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeConfig } from "@/lib/theme";
import { themeToCssVars } from "@/lib/theme";

// ─── Device types ───
export type DeviceType = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DeviceType, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

// ─── Preview frame: renders children inside a device-sized container with theme ───
export function PreviewFrame({
  children,
  theme,
  device = "desktop",
  className,
}: {
  children: ReactNode;
  theme: ThemeConfig;
  device?: DeviceType;
  className?: string;
}) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const width = DEVICE_WIDTHS[device];

  return (
    <div className="flex justify-center w-full transition-all duration-300">
      <div
        className={cn(
          "relative bg-white overflow-hidden transition-all duration-300 shadow-lg",
          device === "mobile" && "rounded-[2rem] border-[8px] border-onyx/80",
          device === "tablet" && "rounded-[1rem] border-[6px] border-onyx/80",
          device === "desktop" && "rounded-lg border border-sand",
          className
        )}
        style={{ width, maxWidth: "100%", ...cssVars }}
      >
        {/* Scrollable preview content */}
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: device === "desktop" ? "70vh" : "65vh",
            fontFamily: `var(--f-body)`,
            background: `var(--c-background)`,
            color: `var(--c-text)`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Device switcher ───
export function DeviceSwitcher({ device, onChange }: { device: DeviceType; onChange: (d: DeviceType) => void }) {
  const devices: { key: DeviceType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "desktop", icon: Monitor, label: "Desktop" },
    { key: "tablet", icon: Tablet, label: "Tablet" },
    { key: "mobile", icon: Smartphone, label: "Mobile" },
  ];
  return (
    <div className="inline-flex items-center gap-1 bg-mist rounded-lg p-1">
      {devices.map((d) => (
        <button
          key={d.key}
          onClick={() => onChange(d.key)}
          title={d.label}
          className={cn(
            "flex items-center justify-center w-9 h-8 rounded-md transition-colors",
            device === d.key ? "bg-card text-onyx shadow-sm" : "text-sepia hover:text-onyx"
          )}
        >
          <d.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

// ─── Edit/Preview toggle (for mobile) ───
export function EditPreviewToggle({ mode, onChange }: { mode: "edit" | "preview"; onChange: (m: "edit" | "preview") => void }) {
  return (
    <div className="inline-flex items-center gap-1 bg-mist rounded-lg p-1">
      <button
        onClick={() => onChange("edit")}
        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", mode === "edit" ? "bg-card text-onyx shadow-sm" : "text-sepia")}
      >
        <Edit3 className="w-3.5 h-3.5" /> Edit
      </button>
      <button
        onClick={() => onChange("preview")}
        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", mode === "preview" ? "bg-card text-onyx shadow-sm" : "text-sepia")}
      >
        <Eye className="w-3.5 h-3.5" /> Preview
      </button>
    </div>
  );
}

// ─── Split-screen editor layout with live preview ───
export function SplitEditor({
  editor,
  preview,
  previewLabel = "Live Preview",
  actions,
}: {
  editor: ReactNode;
  preview: ReactNode;
  previewLabel?: string;
  actions?: ReactNode;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<DeviceType>("desktop");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Desktop: device switcher always visible */}
          <div className="hidden md:block">
            <DeviceSwitcher device={device} onChange={setDevice} />
          </div>
          {/* Mobile: edit/preview toggle */}
          <div className="md:hidden">
            <EditPreviewToggle mode={mode} onChange={setMode} />
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Mobile device switcher (shown in preview mode) */}
      {mode === "preview" && (
        <div className="md:hidden mb-3">
          <DeviceSwitcher device={device} onChange={setDevice} />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
        {/* Editor panel */}
        <div className={cn("flex-1 min-w-0", mode === "preview" && "hidden md:block")}>
          {editor}
        </div>

        {/* Preview panel */}
        <div className={cn("flex-1 min-w-0", mode === "edit" && "hidden md:block")}>
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-widest text-sepia">{previewLabel}</span>
              <span className="text-xs text-sepia/50">{device}</span>
            </div>
            <div className="rounded-xl border border-sand bg-mist/50 p-3 overflow-hidden">
              {/* Pass device down via context — preview component reads it */}
              <PreviewDeviceContext.Provider value={device}>
                {preview}
              </PreviewDeviceContext.Provider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Context to pass device type to preview components ───
import { createContext, useContext } from "react";
const PreviewDeviceContext = createContext<DeviceType>("desktop");
export function usePreviewDevice(): DeviceType {
  return useContext(PreviewDeviceContext);
}
