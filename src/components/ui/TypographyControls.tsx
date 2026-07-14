import type { TypographyStyle } from "../../lib/typography";
import { Input } from "./Input";
import { FontSelect } from "./FontSelect";
import { ColorInput } from "./index";
import { RangeInput } from "./index";
import { Toggle } from "./index";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";

interface TypographyControlsProps {
  label?: string;
  value: TypographyStyle;
  onChange: (v: TypographyStyle) => void;
  showText?: boolean;
}

const WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

const ALIGNS = [
  { label: "Left", value: "left", icon: "M4 6h16M4 12h10M4 18h16" },
  { label: "Center", value: "center", icon: "M4 6h16M7 12h10M4 18h16" },
  { label: "Right", value: "right", icon: "M4 6h16M10 12h10M4 18h16" },
];

export function TypographyControls({ label, value, onChange, showText }: TypographyControlsProps) {
  const update = (patch: Partial<TypographyStyle>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}

      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter text"
        />
      )}

      <FontSelect
        label="Font Family"
        value={value.fontFamily ?? ""}
        onChange={(v) => update({ fontFamily: v })}
        options={HEADING_FONT_OPTIONS}
        placeholder="Select font"
      />

      <RangeInput
        label="Font Size"
        value={value.fontSize ?? 16}
        min={8}
        max={72}
        onChange={(v) => update({ fontSize: v })}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-dash-text">Weight</label>
        <div className="flex gap-2">
          {WEIGHTS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => update({ fontWeight: w.value })}
              style={{ fontWeight: w.value }}
              className={cn(
                "flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                value.fontWeight === w.value
                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <ColorInput
        label="Color"
        value={value.color ?? "#000000"}
        onChange={(v) => update({ color: v })}
      />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-dash-text">Alignment</label>
        <div className="flex gap-2">
          {ALIGNS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => update({ align: a.value })}
              className={cn(
                "flex h-9 flex-1 items-center justify-center rounded-lg border transition-colors",
                value.align === a.value
                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
              )}
              title={a.label}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} /></svg>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Toggle
          label="Italic"
          checked={value.italic ?? false}
          onChange={(v) => update({ italic: v })}
        />
        <Toggle
          label="Underline"
          checked={value.underline ?? false}
          onChange={(v) => update({ underline: v })}
        />
      </div>
    </div>
  );
}
