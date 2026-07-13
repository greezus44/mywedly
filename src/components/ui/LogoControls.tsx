import type { LogoConfig } from "../../lib/supabase";
import { DEFAULT_LOGO_CONFIG } from "../../lib/theme";
import { ImageUpload } from "./ImageUpload";
import { Input, Select, Toggle, ColorInput, RangeInput, Label } from "./Input";
import { FormField } from "./ImageUpload";
import { Monitor, Tablet, Smartphone, Eye, EyeOff } from "lucide-react";

const POSITIONS: { value: LogoConfig["position"]; label: string }[] = [
  { value: "top-left", label: "↖" }, { value: "top-center", label: "↑" }, { value: "top-right", label: "↗" },
  { value: "center", label: "●" },
  { value: "bottom-left", label: "↙" }, { value: "bottom-center", label: "↓" }, { value: "bottom-right", label: "↘" },
];

const PAGES = ["cover", "home", "rsvp", "doa", "contact", "send-message"];

export function LogoControls({ logo, onChange, device = "desktop" }: { logo: LogoConfig; onChange: (l: LogoConfig) => void; device?: "desktop" | "tablet" | "mobile" }) {
  const update = (patch: Partial<LogoConfig>) => onChange({ ...logo, ...patch });
  const updateResponsive = (d: "desktop" | "tablet" | "mobile", patch: Partial<{ width: string; height: string }>) =>
    onChange({ ...logo, responsive: { ...logo.responsive, [d]: { ...logo.responsive[d], ...patch } } });

  return (
    <div className="space-y-6">
      {/* Logo Image & Visibility */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">Logo Image</h4>
        <ImageUpload value={logo.url} onChange={(url) => update({ url })} label="Upload logo" />
        <div className="flex flex-wrap gap-4">
          <Toggle checked={logo.visible} onChange={(v) => update({ visible: v })} label="Show logo" />
          <Toggle checked={logo.showInNavbar} onChange={(v) => update({ showInNavbar: v })} label="Show in navbar" />
        </div>
      </div>

      {/* Device Selector */}
      <div>
        <Label>Responsive Preview Device</Label>
        <div className="mt-1.5 flex gap-2">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...logo })}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${device === d ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              <Icon className="h-4 w-4" /> {d}
            </button>
          ))}
        </div>
      </div>

      {/* Size Controls */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">Size</h4>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Width" value={logo.width} onChange={(e) => update({ width: e.target.value })} />
          <Input label="Height" value={logo.height} onChange={(e) => update({ height: e.target.value })} />
        </div>
        <RangeInput label="Width (px)" value={parseInt(logo.width) || 120} min={20} max={400} unit="px" onChange={(v) => update({ width: `${v}px` })} />
        <Toggle checked={logo.maintainAspectRatio} onChange={(v) => update({ maintainAspectRatio: v })} label="Maintain aspect ratio" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Max Width" value={logo.maxWidth} onChange={(e) => update({ maxWidth: e.target.value })} />
          <Input label="Max Height" value={logo.maxHeight} onChange={(e) => update({ maxHeight: e.target.value })} />
        </div>
        <FormField label="Object Fit">
          <Select value={logo.objectFit} onChange={(e) => update({ objectFit: e.target.value as LogoConfig["objectFit"] })}>
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
          </Select>
        </FormField>
      </div>

      {/* Responsive Sizes */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">Responsive Sizes</h4>
        {(["desktop", "tablet", "mobile"] as const).map((d) => (
          <div key={d}>
            <Label className="capitalize">{d}</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Input placeholder="Width" value={logo.responsive[d].width} onChange={(e) => updateResponsive(d, { width: e.target.value })} />
              <Input placeholder="Height" value={logo.responsive[d].height} onChange={(e) => updateResponsive(d, { height: e.target.value })} />
            </div>
          </div>
        ))}
      </div>

      {/* Position */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">Position</h4>
        <div className="grid grid-cols-3 gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => update({ position: p.value })}
              className={`rounded-lg border py-2.5 text-lg transition ${logo.position === p.value ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-gray-300 text-gray-500 hover:bg-gray-50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="X Offset" value={logo.offsetX} onChange={(e) => update({ offsetX: e.target.value })} />
          <Input label="Y Offset" value={logo.offsetY} onChange={(e) => update({ offsetY: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Margin" value={logo.margin} onChange={(e) => update({ margin: e.target.value })} />
          <Input label="Padding" value={logo.padding} onChange={(e) => update({ padding: e.target.value })} />
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">Styling</h4>
        <RangeInput label="Opacity" value={logo.opacity} min={0} max={1} step={0.05} onChange={(v) => update({ opacity: v })} />
        <Input label="Border Radius" value={logo.borderRadius} onChange={(e) => update({ borderRadius: e.target.value })} />
        <RangeInput label="Rotation" value={logo.rotation} min={-180} max={180} unit="°" onChange={(v) => update({ rotation: v })} />
      </div>

      {/* Drop Shadow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Drop Shadow</h4>
          <Toggle checked={logo.dropShadow.enabled} onChange={(v) => update({ dropShadow: { ...logo.dropShadow, enabled: v } })} />
        </div>
        {logo.dropShadow.enabled && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Blur" value={logo.dropShadow.blur} onChange={(e) => update({ dropShadow: { ...logo.dropShadow, blur: e.target.value } })} />
              <ColorInput label="Color" value={logo.dropShadow.color} onChange={(v) => update({ dropShadow: { ...logo.dropShadow, color: v } })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Offset X" value={logo.dropShadow.offsetX} onChange={(e) => update({ dropShadow: { ...logo.dropShadow, offsetX: e.target.value } })} />
              <Input label="Offset Y" value={logo.dropShadow.offsetY} onChange={(e) => update({ dropShadow: { ...logo.dropShadow, offsetY: e.target.value } })} />
            </div>
          </div>
        )}
      </div>

      {/* Glow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Glow Effect</h4>
          <Toggle checked={logo.glow.enabled} onChange={(v) => update({ glow: { ...logo.glow, enabled: v } })} />
        </div>
        {logo.glow.enabled && (
          <div className="grid grid-cols-2 gap-3">
            <ColorInput label="Color" value={logo.glow.color} onChange={(v) => update({ glow: { ...logo.glow, color: v } })} />
            <Input label="Blur" value={logo.glow.blur} onChange={(e) => update({ glow: { ...logo.glow, blur: e.target.value } })} />
          </div>
        )}
      </div>

      {/* Page Visibility */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900">Page Visibility</h4>
        <FormField label="Show on">
          <Select value={logo.showOnPages} onChange={(e) => update({ showOnPages: e.target.value as LogoConfig["showOnPages"] })}>
            <option value="all-pages">All pages</option>
            <option value="cover-only">Cover page only</option>
            <option value="custom">Custom pages</option>
          </Select>
        </FormField>
        {logo.showOnPages === "custom" && (
          <div className="space-y-2">
            {PAGES.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={logo.customPages.includes(p)}
                  onChange={(e) => {
                    const pages = e.target.checked ? [...logo.customPages, p] : logo.customPages.filter((x) => x !== p);
                    update({ customPages: pages });
                  }}
                  className="rounded"
                />
                {p}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_LOGO_CONFIG })}
        className="w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
      >
        Reset to Default
      </button>
    </div>
  );
}
