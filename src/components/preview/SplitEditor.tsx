import { useState, type ReactNode } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "../../lib/utils";
type Device = "desktop" | "tablet" | "mobile";
const deviceSizes: Record<Device, { width: string; label: string; icon: typeof Monitor }> = { desktop: { width: "100%", label: "Desktop", icon: Monitor }, tablet: { width: "768px", label: "Tablet", icon: Tablet }, mobile: { width: "375px", label: "Mobile", icon: Smartphone } };
export function SplitEditor({ preview, children }: { preview: ReactNode; children: ReactNode }) {
  const [device, setDevice] = useState<Device>("desktop");
  const { width } = deviceSizes[device];
  return <div className="grid lg:grid-cols-2 gap-0 min-h-[calc(100vh-200px)]"><div className="border-r border-gray-200 overflow-y-auto p-6 lg:p-8 bg-gray-50">{children}</div><div className="bg-gray-50 flex flex-col"><div className="flex items-center justify-center gap-2 py-3 border-b border-gray-200 bg-white">{(Object.keys(deviceSizes) as Device[]).map((d) => { const DIcon = deviceSizes[d].icon; return <button key={d} onClick={() => setDevice(d)} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider transition-colors rounded", device === d ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900")}><DIcon className="w-3.5 h-3.5" />{deviceSizes[d].label}</button>; })}</div><div className="flex-1 overflow-y-auto flex justify-center p-6"><div style={{ width }} className="bg-white shadow-lg transition-all duration-300 min-h-[400px] overflow-hidden rounded-lg">{preview}</div></div></div></div>;
}
