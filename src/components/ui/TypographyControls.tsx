import type { TypographyStyle } from "../../lib/typography";
import { Input } from "./Input";
import { FontSelect } from "./FontSelect";
import { ColorInput, RangeInput, Toggle } from "./index";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

interface TypographyControlsProps {
  label?: string;
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  showText?: boolean;
}

const WEIGHTS = [400, 500, 700];
const ALIGNS = [
  { value: "left", label: "L" },
  { value: "center", label: "C" },
  { value: "right", label: "R" },
];

export function TypographyControls({ label, value, onChange, showText }: TypographyControlsProps) {
  const update = (patch: Partial<TypographyStyle>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-lg border border-dash-border bg-dash-surface p-3">
      {label && <h4 className="text-xs font-semibold text-dash-text">{label}</h4>}
      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter text"
        />
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">Font Family</label>
        <FontSelect
          value={value.fontFamily ?? ""}
          onChange={(v) => update({ fontFamily: v })}
          options={HEADING_FONT_OPTIONS}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">Font Size</label>
        <div className="flex items-center gap-2">
          <select
            value={FONT_SIZES.includes(value.fontSize ?? 16) ? value.fontSize : "custom"}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== "custom") update({ fontSize: Number(v) });
            }}
            className="flex-1 rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
          >
            {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
            {!FONT_SIZES.includes(value.fontSize ?? 16) && value.fontSize !== undefined && <option value="custom">{value.fontSize}px</option>}
          </select>
          <input
            type="number"
            value={value.fontSize ?? 16}
            onChange={(e) => update({ fontSize: Math.max(1, Math.min(200, Number(e.target.value))) })}
            min={1}
            max={200}
            className="w-20 rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
          />
          <span className="text-xs text-dash-muted">px</span>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">Weight</label>
        <div className="flex gap-1">
          {WEIGHTS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => update({ fontWeight: w })}
              className={cn(
                "rounded border px-3 py-1 text-xs transition-colors",
                (value.fontWeight ?? 400) === w
                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border text-dash-muted hover:bg-dash-bg",
              )}
              style={{ fontWeight: w }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">Text Colour</label>
        <ColorInput value={value.color ?? "#000000"} onChange={(v) => update({ color: v })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">Background Colour</label>
        <ColorInput value={value.backgroundColor ?? ""} onChange={(v) => update({ backgroundColor: v })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-dash-muted">Alignment</label>
        <div className="flex gap-1">
          {ALIGNS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => update({ align: a.value })}
              className={cn(
                "rounded border px-3 py-1 text-xs transition-colors",
                (value.align ?? "left") === a.value
                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border text-dash-muted hover:bg-dash-bg",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-4">
        <Toggle checked={value.italic ?? false} onChange={(v) => update({ italic: v })} label="Italic" />
        <Toggle checked={value.underline ?? false} onChange={(v) => update({ underline: v })} label="Underline" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Border Colour</label>
          <ColorInput value={value.borderColor ?? ""} onChange={(v) => update({ borderColor: v })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Border Width (px)</label>
          <input type="number" value={value.borderWidth ?? 0} onChange={(e) => update({ borderWidth: Math.max(0, Number(e.target.value)) })} min={0} max={20} className="w-full rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Border Radius (px)</label>
          <input type="number" value={value.borderRadius ?? 0} onChange={(e) => update({ borderRadius: Math.max(0, Number(e.target.value)) })} min={0} max={100} className="w-full rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-dash-muted">Padding</label>
          <input type="text" value={value.padding ?? ""} onChange={(e) => update({ padding: e.target.value })} placeholder="e.g. 8px 16px" className="w-full rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
        </div>
      </div>
      <RangeInput
        label="Line Spacing"
        value={value.lineHeight ?? 1.5}
        onChange={(v) => update({ lineHeight: v })}
        min={1}
        max={3}
        step={0.1}
      />
    </div>
  );
}
