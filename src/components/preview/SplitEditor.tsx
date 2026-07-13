import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Monitor, Tablet, Smartphone, RotateCw } from "lucide-react";
import { cn } from "../../lib/utils";

export type DeviceType = "desktop" | "tablet" | "mobile";
export type Orientation = "portrait" | "landscape";

interface DeviceConfig { width: number; height: number; label: string; icon: ReactNode; }

const DEVICE_CONFIGS: Record<DeviceType, Record<Orientation, DeviceConfig>> = {
  desktop: { landscape: { width: 1280, height: 800, label: "Desktop", icon: <Monitor className="w-4 h-4" /> }, portrait: { width: 1280, height: 800, label: "Desktop", icon: <Monitor className="w-4 h-4" /> } },
  tablet: { portrait: { width: 768, height: 1024, label: "Tablet", icon: <Tablet className="w-4 h-4" /> }, landscape: { width: 1024, height: 768, label: "Tablet", icon: <Tablet className="w-4 h-4" /> } },
  mobile: { portrait: { width: 375, height: 667, label: "Mobile", icon: <Smartphone className="w-4 h-4" /> }, landscape: { width: 667, height: 375, label: "Mobile", icon: <Smartphone className="w-4 h-4" /> } },
};

interface SplitEditorProps {
  children: ReactNode;
  preview: ReactNode;
  title?: string;
  previewKey?: string;
}

export function SplitEditor({ children, preview, title, previewKey }: SplitEditorProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const config = DEVICE_CONFIGS[device][device === "desktop" ? "landscape" : orientation];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth - 48;
    const ch = container.clientHeight - 48;
    setScale(Math.min(cw / config.width, ch / config.height, 1));
  }, [device, orientation, config.width, config.height]);

  const handleScroll = useCallback(() => { if (previewScrollRef.current) scrollPosRef.current = { x: previewScrollRef.current.scrollLeft, y: previewScrollRef.current.scrollTop }; }, []);

  useEffect(() => { if (previewScrollRef.current) { previewScrollRef.current.scrollLeft = scrollPosRef.current.x; previewScrollRef.current.scrollTop = scrollPosRef.current.y; } }, [previewKey]);

  const devices: DeviceType[] = ["desktop", "tablet", "mobile"];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[600px]">
      <div className="lg:w-[400px] lg:flex-shrink-0 lg:overflow-y-auto bg-white rounded-xl border border-gray-200 p-5 lg:max-h-[calc(100vh-200px)]">
        {title && <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>}
        {children}
      </div>
      <div ref={containerRef} className="flex-1 bg-gray-100 rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-1">
            {devices.map(d => { const cfg = DEVICE_CONFIGS[d][d === "desktop" ? "landscape" : orientation]; return (
              <button key={d} onClick={() => setDevice(d)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", device === d ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100")} title={cfg.label}>
                {cfg.icon}<span className="hidden sm:inline">{cfg.label}</span>
              </button>
            ); })}
          </div>
          {device !== "desktop" && (
            <button onClick={() => setOrientation(orientation === "portrait" ? "landscape" : "portrait")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
              <RotateCw className="w-4 h-4" /><span className="hidden sm:inline capitalize">{orientation}</span>
            </button>
          )}
        </div>
        <div ref={previewScrollRef} onScroll={handleScroll} className="flex-1 overflow-auto flex items-start justify-center p-6 scrollbar-thin">
          <div className="preview-frame bg-white shadow-lg transition-all duration-300 flex-shrink-0" style={{ width: `${config.width}px`, height: `${config.height}px`, transform: `scale(${scale})`, transformOrigin: "top center" }}>
            <div key={previewKey} className="w-full h-full overflow-y-auto">{preview}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
