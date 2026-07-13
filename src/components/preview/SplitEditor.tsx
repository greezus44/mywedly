import { useState, type ReactNode } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "../../lib/utils";
type Device = "desktop" | "tablet" | "mobile";
const deviceWidths: Record<Device, string> = { desktop: "100%", tablet: "768px", mobile: "375px" };
export function SplitEditor({ children, preview }: { children: ReactNode; preview: ReactNode }) {
  const [device, setDevice] = useState<Device>("desktop");
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="lg:w-[400px] lg:flex-shrink-0 lg:overflow-y-auto lg:max-h-[calc(100vh-200px)]">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">{children}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => { const icons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone }; const Icon = icons[d]; return <button key={d} onClick={() => setDevice(d)} className={cn("p-2 rounded-lg transition-colors", device === d ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}><Icon className="w-4 h-4" /></button>; })}
        </div>
        <div className="flex justify-center bg-slate-50 rounded-xl border border-slate-200 p-4 overflow-hidden">
          <div style={{ width: deviceWidths[device], maxWidth: "100%" }} className="transition-all duration-300"><div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">{preview}</div></div>
        </div>
      </div>
    </div>
  );
}
