import { type ReactNode, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Monitor, Tablet, Smartphone, Maximize2, ZoomIn, ZoomOut, RotateCcw, RotateCw, Eye, Edit3, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeConfig } from "@/lib/theme";
import { themeToCssVars } from "@/lib/theme";

// ─── Device types ───
export type DeviceType = "desktop" | "tablet" | "mobile";
export type Orientation = "portrait" | "landscape";
export type ZoomLevel = "fit" | "50" | "75" | "100" | "125";

// ─── Device dimensions (CSS px) ───
const DEVICE_DIMS: Record<DeviceType, Record<Orientation, { w: number; h: number }>> = {
  desktop: {
    portrait: { w: 1440, h: 900 },
    landscape: { w: 1440, h: 900 },
  },
  tablet: {
    portrait: { w: 768, h: 1024 },
    landscape: { w: 1024, h: 768 },
  },
  mobile: {
    portrait: { w: 375, h: 812 },
    landscape: { w: 812, h: 375 },
  },
};

const ZOOM_VALUES: Record<ZoomLevel, number> = {
  fit: 0, "50": 0.5, "75": 0.75, "100": 1, "125": 1.25,
};

// ─── Device frame component ───
function DeviceFrame({ device, orientation, children }: { device: DeviceType; orientation: Orientation; children: ReactNode }) {
  if (device === "desktop") {
    return (
      <div className="rounded-t-lg overflow-hidden border border-onyx/20 shadow-2xl bg-white">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-3 py-2 bg-mist border-b border-sand">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 ml-3 h-6 rounded bg-white border border-sand flex items-center px-2">
            <span className="text-[10px] text-sepia/50">https://your-wedding.com</span>
          </div>
        </div>
        {children}
      </div>
    );
  }

  if (device === "tablet") {
    return (
      <div className="rounded-[2rem] border-[10px] border-onyx/80 shadow-2xl bg-onyx/80 overflow-hidden">
        {/* Camera dot */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sepia/30 z-10" />
        {children}
      </div>
    );
  }

  // Mobile
  return (
    <div className="rounded-[2.5rem] border-[8px] border-onyx/90 shadow-2xl bg-onyx/90 overflow-hidden relative">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-onyx/90 rounded-b-2xl z-10" />
      {children}
    </div>
  );
}

// ─── Iframe-based preview that renders the actual guest website ───
export function PreviewIframe({
  weddingSlug,
  initialPath = "",
  device,
  orientation,
  draftData,
  className,
}: {
  weddingSlug: string;
  initialPath?: string;
  device: DeviceType;
  orientation: Orientation;
  draftData: { theme?: ThemeConfig; content?: Record<string, unknown> } | null;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Send draft data to iframe via postMessage whenever it changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !draftData) return;
    const send = () => {
      iframe.contentWindow?.postMessage({
        type: "preview-update",
        theme: draftData.theme,
        content: draftData.content,
      }, "*");
    };
    // Send after iframe loads
    const handleLoad = () => send();
    iframe.addEventListener("load", handleLoad);
    // Also send immediately if already loaded
    send();
    return () => iframe.removeEventListener("load", handleLoad);
  }, [draftData]);

  const dims = DEVICE_DIMS[device][orientation];

  return (
    <div
      className={cn("overflow-hidden bg-white", className)}
      style={{ width: dims.w, height: dims.h }}
    >
      <iframe
        ref={iframeRef}
        key={iframeKey}
        src={`/w/${weddingSlug}${initialPath}?preview=true`}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

// ─── Inline preview (for when iframe isn't suitable, e.g. cover page) ───
export function InlinePreview({
  children,
  theme,
  device,
  orientation,
  className,
}: {
  children: ReactNode;
  theme: ThemeConfig;
  device: DeviceType;
  orientation: Orientation;
  className?: string;
}) {
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);
  const dims = DEVICE_DIMS[device][orientation];

  return (
    <div className="flex justify-center w-full">
      <div
        className={cn("relative bg-white overflow-hidden", className)}
        style={{ width: dims.w, maxWidth: "100%", ...cssVars }}
      >
        <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
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
          className={cn("flex items-center justify-center w-9 h-8 rounded-md transition-colors", device === d.key ? "bg-card text-onyx shadow-sm" : "text-sepia hover:text-onyx")}
        >
          <d.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

// ─── Orientation toggle ───
export function OrientationToggle({ orientation, onChange, disabled }: { orientation: Orientation; onChange: (o: Orientation) => void; disabled?: boolean }) {
  if (disabled) return null;
  return (
    <button
      onClick={() => onChange(orientation === "portrait" ? "landscape" : "portrait")}
      title={orientation === "portrait" ? "Switch to Landscape" : "Switch to Portrait"}
      className="inline-flex items-center justify-center w-9 h-8 rounded-md bg-mist text-sepia hover:text-onyx transition-colors"
    >
      {orientation === "portrait" ? <RotateCcw className="w-4 h-4" /> : <RotateCw className="w-4 h-4" />}
    </button>
  );
}

// ─── Zoom controls ───
export function ZoomControls({ zoom, onChange }: { zoom: ZoomLevel; onChange: (z: ZoomLevel) => void }) {
  const levels: ZoomLevel[] = ["fit", "50", "75", "100", "125"];
  return (
    <div className="inline-flex items-center gap-1 bg-mist rounded-lg p-1">
      {levels.map((z) => (
        <button
          key={z}
          onClick={() => onChange(z)}
          className={cn("px-2.5 py-1 text-xs font-medium rounded-md transition-colors", zoom === z ? "bg-card text-onyx shadow-sm" : "text-sepia hover:text-onyx")}
        >
          {z === "fit" ? "Fit" : `${z}%`}
        </button>
      ))}
    </div>
  );
}

// ─── Edit/Preview toggle (for mobile) ───
export function EditPreviewToggle({ mode, onChange }: { mode: "edit" | "preview"; onChange: (m: "edit" | "preview") => void }) {
  return (
    <div className="inline-flex items-center gap-1 bg-mist rounded-lg p-1">
      <button onClick={() => onChange("edit")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", mode === "edit" ? "bg-card text-onyx shadow-sm" : "text-sepia")}>
        <Edit3 className="w-3.5 h-3.5" /> Edit
      </button>
      <button onClick={() => onChange("preview")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", mode === "preview" ? "bg-card text-onyx shadow-sm" : "text-sepia")}>
        <Eye className="w-3.5 h-3.5" /> Preview
      </button>
    </div>
  );
}

// ─── Full-screen preview modal ───
export function FullscreenPreview({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-onyx/80 backdrop-blur-sm flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 bg-onyx text-parchment">
        <span className="text-sm font-medium">Full Screen Preview</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-parchment/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

// ─── Split editor with live preview ───
export function SplitEditor({
  editor,
  preview,
  previewLabel = "Live Preview",
  actions,
  draftData,
}: {
  editor: ReactNode;
  preview: ReactNode;
  previewLabel?: string;
  actions?: ReactNode;
  draftData?: { theme?: ThemeConfig; content?: Record<string, unknown> } | null;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [zoom, setZoom] = useState<ZoomLevel>("fit");
  const [fullscreen, setFullscreen] = useState(false);

  // Desktop defaults to landscape, tablet/mobile to portrait
  useEffect(() => {
    setOrientation(device === "desktop" ? "landscape" : "portrait");
  }, [device]);

  const dims = DEVICE_DIMS[device][orientation];

  // Calculate zoom scale
  const zoomScale = useMemo(() => {
    if (zoom === "fit") {
      // Calculate fit based on container — we'll use a reasonable default
      const maxW = device === "desktop" ? 700 : 500;
      const maxH = 500;
      return Math.min(maxW / dims.w, maxH / dims.h, 1);
    }
    return ZOOM_VALUES[zoom];
  }, [zoom, dims, device]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <DeviceSwitcher device={device} onChange={setDevice} />
          {device !== "desktop" && <OrientationToggle orientation={orientation} onChange={setOrientation} />}
          <ZoomControls zoom={zoom} onChange={setZoom} />
          <button
            onClick={() => setFullscreen(true)}
            title="Full Screen"
            className="inline-flex items-center justify-center w-9 h-8 rounded-md bg-mist text-sepia hover:text-onyx transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: edit/preview toggle */}
          <div className="md:hidden">
            <EditPreviewToggle mode={mode} onChange={setMode} />
          </div>
          {actions}
        </div>
      </div>

      {/* Mobile device switcher (in preview mode) */}
      {mode === "preview" && (
        <div className="md:hidden mb-3 flex items-center gap-2">
          <DeviceSwitcher device={device} onChange={setDevice} />
          {device !== "desktop" && <OrientationToggle orientation={orientation} onChange={setOrientation} />}
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
              <span className="text-xs text-sepia/50">{device} · {orientation} · {dims.w}×{dims.h}</span>
            </div>
            <div className="rounded-xl border border-sand bg-mist/50 p-4 overflow-auto" style={{ maxHeight: "75vh" }}>
              <div className="flex justify-center" style={{ transform: `scale(${zoomScale})`, transformOrigin: "top center", transition: "transform 0.2s ease" }}>
                <DeviceFrame device={device} orientation={orientation}>
                  <div style={{ width: dims.w, height: dims.h }} className="overflow-hidden">
                    {preview}
                  </div>
                </DeviceFrame>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen preview */}
      <FullscreenPreview open={fullscreen} onClose={() => setFullscreen(false)}>
        <div className="flex justify-center" style={{ transform: `scale(${zoomScale})`, transformOrigin: "center", transition: "transform 0.2s ease" }}>
          <DeviceFrame device={device} orientation={orientation}>
            <div style={{ width: dims.w, height: dims.h }} className="overflow-hidden">
              {preview}
            </div>
          </DeviceFrame>
        </div>
      </FullscreenPreview>
    </div>
  );
}
