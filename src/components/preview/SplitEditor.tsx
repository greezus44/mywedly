import { useState, type ReactNode } from "react";
import { Monitor, Tablet, Smartphone, Maximize2, Minimize2, RotateCw, Edit3, Eye } from "lucide-react";
import { cn } from "../../lib/utils";

export type DeviceType = "desktop" | "tablet" | "mobile";
export type Orientation = "portrait" | "landscape";
export type ZoomLevel = "fit" | "50" | "75" | "100" | "125";

const DEVICE_DIMS: Record<DeviceType, { portrait: { w: number; h: number }; landscape: { w: number; h: number } }> = {
  desktop: { portrait: { w: 1440, h: 900 }, landscape: { w: 1440, h: 900 } },
  tablet: { portrait: { w: 768, h: 1024 }, landscape: { w: 1024, h: 768 } },
  mobile: { portrait: { w: 375, h: 812 }, landscape: { w: 812, h: 375 } },
};

function DeviceFrame({ device, orientation, children }: { device: DeviceType; orientation: Orientation; children: ReactNode }) {
  const dims = DEVICE_DIMS[device][orientation];
  if (device === "desktop") {
    return (
      <div style={{ width: dims.w }}>
        <div className="device-browser-bar">
          <div className="device-browser-dot" style={{ background: "#ff5f56" }} />
          <div className="device-browser-dot" style={{ background: "#ffbd2e" }} />
          <div className="device-browser-dot" style={{ background: "#27c93f" }} />
          <div className="flex-1 ml-3 h-6 bg-white rounded-md border border-gray-200 flex items-center px-3 text-xs text-gray-400 font-ui">https://wedding-invitation.com</div>
        </div>
        <div style={{ width: dims.w, height: dims.h }} className="overflow-y-auto bg-[var(--color-bg)] border-l border-r border-b border-gray-300">{children}</div>
      </div>
    );
  }
  if (device === "tablet") {
    return (
      <div className="device-tablet-frame" style={{ width: dims.w + 28, height: dims.h + 28 }}>
        <div style={{ width: dims.w, height: dims.h }} className="overflow-y-auto bg-[var(--color-bg)] rounded-sm">{children}</div>
      </div>
    );
  }
  return (
    <div className="device-mobile-frame" style={{ width: dims.w + 20, height: dims.h + 20 }}>
      {orientation === "portrait" && <div className="device-mobile-notch" />}
      <div style={{ width: dims.w, height: dims.h }} className="overflow-y-auto bg-[var(--color-bg)] rounded-sm">{children}</div>
    </div>
  );
}

export function SplitEditor({ title, children, preview }: { title: string; children: ReactNode; preview: ReactNode }) {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [zoom, setZoom] = useState<ZoomLevel>("fit");
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const zoomScale = zoom === "fit" ? null : parseInt(zoom) / 100;

  const previewContent = (
    <div className="flex items-center justify-center p-4 bg-gray-50 min-h-full">
      <div style={zoomScale ? { transform: `scale(${zoomScale})`, transformOrigin: "center top" } : undefined}>
        <DeviceFrame device={device} orientation={orientation}>{preview}</DeviceFrame>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-gray-100 flex-wrap">
        <span className="font-ui text-xs uppercase tracking-wider-luxe text-gray-400 hidden md:inline">{title}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([type, Icon]) => (
              <button key={type} onClick={() => { setDevice(type); setOrientation("portrait"); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-ui font-medium transition-all", device === type ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-gray-500 hover:text-gray-700")}>
                <Icon size={14} /><span className="hidden sm:inline">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            ))}
          </div>
          {device !== "desktop" && (
            <button onClick={() => setOrientation(orientation === "portrait" ? "landscape" : "portrait")} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-ui font-medium text-gray-600 transition-all">
              <RotateCw size={14} /><span className="hidden sm:inline">{orientation === "portrait" ? "Portrait" : "Landscape"}</span>
            </button>
          )}
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["fit", "50", "75", "100", "125"] as ZoomLevel[]).map((l) => (
              <button key={l} onClick={() => setZoom(l)} className={cn("px-2.5 py-1.5 rounded-md text-xs font-ui font-medium transition-all", zoom === l ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-gray-500 hover:text-gray-700")}>{l === "fit" ? "Fit" : `${l}%`}</button>
            ))}
          </div>
          <button onClick={() => setFullscreen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-ui font-medium text-gray-600 transition-all"><Maximize2 size={14} /></button>
        </div>
      </div>
      <div className="lg:hidden flex items-center gap-1 p-1 bg-gray-100 border-b border-gray-100">
        <button onClick={() => setMobileView("edit")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-ui font-medium transition-all", mobileView === "edit" ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-gray-500")}><Edit3 size={14} /> Edit</button>
        <button onClick={() => setMobileView("preview")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-ui font-medium transition-all", mobileView === "preview" ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-gray-500")}><Eye size={14} /> Preview</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className={cn("w-full lg:w-[420px] lg:flex-shrink-0 overflow-y-auto p-6 bg-white border-r border-gray-100", mobileView === "edit" ? "block" : "hidden lg:block")}>{children}</div>
        <div className={cn("flex-1 overflow-y-auto bg-gray-50", mobileView === "preview" ? "block" : "hidden lg:block")}>{previewContent}</div>
      </div>
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8 animate-fade-in">
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"><Minimize2 size={20} /></button>
          <div className="max-w-full max-h-full overflow-auto"><DeviceFrame device={device} orientation={orientation}>{preview}</DeviceFrame></div>
        </div>
      )}
    </div>
  );
}
