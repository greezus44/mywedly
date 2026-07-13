import { type LogoConfig } from "../../lib/supabase";
import { DEFAULT_LOGO_CONFIG } from "../../lib/theme";
import { ImageUpload } from "./ImageUpload";
import { Toggle, RangeInput, Label, Select } from "./Input";
import { FormField } from "./ImageUpload";
import { RotateCcw } from "lucide-react";
import { cn } from "../../lib/utils";

const POSITION_OPTIONS: { value: LogoConfig["position"]; label: string; row: number; col: number }[] = [
  { value: "top-left", label: "Top Left", row: 0, col: 0 },
  { value: "top-center", label: "Top Center", row: 0, col: 1 },
  { value: "top-right", label: "Top Right", row: 0, col: 2 },
  { value: "center", label: "Center", row: 1, col: 1 },
  { value: "bottom-left", label: "Bottom Left", row: 2, col: 0 },
  { value: "bottom-center", label: "Bottom Center", row: 2, col: 1 },
  { value: "bottom-right", label: "Bottom Right", row: 2, col: 2 },
];

const PAGE_OPTIONS = [
  { value: "cover", label: "Cover Page" },
  { value: "home", label: "Home" },
  { value: "rsvp", label: "RSVP" },
  { value: "doa", label: "Doa" },
  { value: "contact", label: "Contact" },
  { value: "send-message", label: "Send Message" },
];

interface LogoControlsProps {
  logo: LogoConfig;
  onChange: (logo: LogoConfig) => void;
  device?: "desktop" | "tablet" | "mobile";
  onDeviceChange?: (device: "desktop" | "tablet" | "mobile") => void;
}

export function LogoControls({ logo, onChange, device = "desktop", onDeviceChange }: LogoControlsProps) {
  const update = (patch: Partial<LogoConfig>) => onChange({ ...logo, ...patch });
  const updateResponsive = (d: "desktop" | "tablet" | "mobile", patch: Partial<{ width: string; height: string }>) => {
    onChange({ ...logo, responsive: { ...logo.responsive, [d]: { ...logo.responsive[d], ...patch } } });
  };
  const reset = () => onChange({ ...DEFAULT_LOGO_CONFIG, url: logo.url });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="font-ui text-sm font-semibold text-gray-900">Logo Customisation</h4>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs font-ui text-gray-400 hover:text-indigo-600 transition-colors">
          <RotateCcw size={12} /> Reset to Default
        </button>
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <FormField label="Logo Image">
          <ImageUpload value={logo.url} onChange={(url) => update({ url })} />
        </FormField>
        <div className="flex items-center gap-6">
          <Toggle checked={logo.visible} onChange={(v) => update({ visible: v })} label="Show Logo" />
          <Toggle checked={logo.showInNavbar} onChange={(v) => update({ showInNavbar: v })} label="Show in Navbar" />
        </div>
      </div>

      {/* Device selector for responsive sizes */}
      {onDeviceChange && (
        <div>
          <Label>Device Preview</Label>
          <div className="inline-flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["desktop", "tablet", "mobile"] as const).map((d) => (
              <button key={d} onClick={() => onDeviceChange(d)} className={cn("px-3 py-1.5 rounded-md text-xs font-ui font-medium transition-all", device === d ? "bg-white shadow-sm text-indigo-600" : "text-gray-500")}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Controls */}
      <div className="space-y-3">
        <h5 className="font-ui text-xs font-semibold text-gray-700 uppercase tracking-wider">Size & Dimensions</h5>
        <div className="flex items-center gap-3">
          <Toggle checked={logo.maintainAspectRatio} onChange={(v) => update({ maintainAspectRatio: v })} label="Maintain Aspect Ratio" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={`Width (${device})`}>
            <input type="text" value={logo.responsive[device].width} onChange={(e) => updateResponsive(device, { width: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="e.g. 64px" />
          </FormField>
          {!logo.maintainAspectRatio && (
            <FormField label={`Height (${device})`}>
              <input type="text" value={logo.responsive[device].height} onChange={(e) => updateResponsive(device, { height: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="e.g. 64px" />
            </FormField>
          )}
        </div>
        <RangeInput label="Width Slider" value={parseInt(logo.responsive[device].width) || 64} onChange={(v) => updateResponsive(device, { width: `${v}px` })} min={20} max={400} step={2} unit="px" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Max Width">
            <input type="text" value={logo.maxWidth} onChange={(e) => update({ maxWidth: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="e.g. none" />
          </FormField>
          <FormField label="Max Height">
            <input type="text" value={logo.maxHeight} onChange={(e) => update({ maxHeight: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="e.g. none" />
          </FormField>
        </div>
        <FormField label="Object Fit">
          <Select value={logo.objectFit} onChange={(e) => update({ objectFit: e.target.value as LogoConfig["objectFit"] })} className="!bg-white !border-gray-200 !text-gray-700">
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
          </Select>
        </FormField>
      </div>

      {/* Responsive Sizes */}
      <div className="space-y-3">
        <h5 className="font-ui text-xs font-semibold text-gray-700 uppercase tracking-wider">Responsive Sizes</h5>
        <div className="space-y-2">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <div key={d} className="flex items-center gap-2">
              <span className="font-ui text-xs text-gray-500 w-16 capitalize">{d}</span>
              <input type="text" value={logo.responsive[d].width} onChange={(e) => updateResponsive(d, { width: e.target.value })} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg font-ui text-xs text-gray-700" placeholder="Width" />
              <input type="text" value={logo.responsive[d].height} onChange={(e) => updateResponsive(d, { height: e.target.value })} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg font-ui text-xs text-gray-700" placeholder="Height" />
            </div>
          ))}
        </div>
      </div>

      {/* Positioning */}
      <div className="space-y-3">
        <h5 className="font-ui text-xs font-semibold text-gray-700 uppercase tracking-wider">Position</h5>
        <Label>Position Preset</Label>
        <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
          {POSITION_OPTIONS.map((pos) => (
            <button key={pos.value} onClick={() => update({ position: pos.value })} className={cn("aspect-square rounded-lg border-2 transition-all flex items-center justify-center", logo.position === pos.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300")}>
              <div className={cn("w-2 h-2 rounded-full", logo.position === pos.value ? "bg-indigo-500" : "bg-gray-300")} />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Offset X (horizontal)">
            <input type="text" value={logo.offsetX} onChange={(e) => update({ offsetX: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="0px" />
          </FormField>
          <FormField label="Offset Y (vertical)">
            <input type="text" value={logo.offsetY} onChange={(e) => update({ offsetY: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="0px" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Margin">
            <input type="text" value={logo.margin} onChange={(e) => update({ margin: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="0px" />
          </FormField>
          <FormField label="Padding">
            <input type="text" value={logo.padding} onChange={(e) => update({ padding: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="0px" />
          </FormField>
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-3">
        <h5 className="font-ui text-xs font-semibold text-gray-700 uppercase tracking-wider">Styling</h5>
        <RangeInput label="Opacity" value={logo.opacity} onChange={(v) => update({ opacity: v })} min={0} max={100} step={5} unit="%" />
        <FormField label="Corner Radius">
          <input type="text" value={logo.borderRadius} onChange={(e) => update({ borderRadius: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="0px" />
        </FormField>
        <RangeInput label="Rotation" value={logo.rotation} onChange={(v) => update({ rotation: v })} min={-180} max={180} step={1} unit="°" />

        <div className="space-y-2 pt-2">
          <Toggle checked={logo.dropShadow.enabled} onChange={(v) => update({ dropShadow: { ...logo.dropShadow, enabled: v } })} label="Drop Shadow" />
          {logo.dropShadow.enabled && (
            <div className="pl-7 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={logo.dropShadow.blur} onChange={(e) => update({ dropShadow: { ...logo.dropShadow, blur: e.target.value } })} className="px-3 py-1.5 border border-gray-200 rounded-lg font-ui text-xs text-gray-700" placeholder="Blur" />
                <input type="color" value={logo.dropShadow.color} onChange={(e) => update({ dropShadow: { ...logo.dropShadow, color: e.target.value } })} className="h-8 w-full rounded-lg border border-gray-200 cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={logo.dropShadow.offsetX} onChange={(e) => update({ dropShadow: { ...logo.dropShadow, offsetX: e.target.value } })} className="px-3 py-1.5 border border-gray-200 rounded-lg font-ui text-xs text-gray-700" placeholder="Offset X" />
                <input type="text" value={logo.dropShadow.offsetY} onChange={(e) => update({ dropShadow: { ...logo.dropShadow, offsetY: e.target.value } })} className="px-3 py-1.5 border border-gray-200 rounded-lg font-ui text-xs text-gray-700" placeholder="Offset Y" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Toggle checked={logo.glow.enabled} onChange={(v) => update({ glow: { ...logo.glow, enabled: v } })} label="Glow Effect" />
          {logo.glow.enabled && (
            <div className="pl-7 grid grid-cols-2 gap-2">
              <input type="text" value={logo.glow.blur} onChange={(e) => update({ glow: { ...logo.glow, blur: e.target.value } })} className="px-3 py-1.5 border border-gray-200 rounded-lg font-ui text-xs text-gray-700" placeholder="Blur" />
              <input type="color" value={logo.glow.color} onChange={(e) => update({ glow: { ...logo.glow, color: e.target.value } })} className="h-8 w-full rounded-lg border border-gray-200 cursor-pointer" />
            </div>
          )}
        </div>
      </div>

      {/* Page Visibility */}
      <div className="space-y-3">
        <h5 className="font-ui text-xs font-semibold text-gray-700 uppercase tracking-wider">Visibility Controls</h5>
        <FormField label="Show Logo On">
          <Select value={logo.showOnPages} onChange={(e) => update({ showOnPages: e.target.value as LogoConfig["showOnPages"] })} className="!bg-white !border-gray-200 !text-gray-700">
            <option value="cover-only">Cover Page Only</option>
            <option value="all-pages">All Pages</option>
            <option value="custom">Custom Pages</option>
          </Select>
        </FormField>
        {logo.showOnPages === "custom" && (
          <div className="space-y-1.5 pl-1">
            {PAGE_OPTIONS.map((page) => (
              <label key={page.value} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={logo.customPages.includes(page.value)} onChange={(e) => {
                  const pages = e.target.checked ? [...logo.customPages, page.value] : logo.customPages.filter((p) => p !== page.value);
                  update({ customPages: pages });
                }} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="font-ui text-xs text-gray-600">{page.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
