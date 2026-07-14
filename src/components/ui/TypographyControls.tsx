import type { TypographyStyle } from "../../lib/typography";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { Input } from "./Input";
import { FontSelect } from "./FontSelect";
import { ColorInput, RangeInput, Toggle } from "./index";
import { cn } from "../../lib/utils";

interface TypographyControlsProps {
  label?: string;
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  showText?: boolean;
}

const WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

const ALIGNS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

export function TypographyControls({ label, value, onChange, showText }: TypographyControlsProps) {
  const update = (patch: Partial<TypographyStyle>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      {label && <h3 className="text-sm font-semibold text-dash-text">{label}</h3>}
      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter text"
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        <FontSelect
          label="Font Family"
          value={value.fontFamily ?? ""}
          onChange={(v) => update({ fontFamily: v })}
          options={HEADING_FONT_OPTIONS}
          placeholder="Default heading font"
        />
        <RangeInput
          label="Font Size"
          value={value.fontSize ?? 24}
          min={8}
          max={72}
          onChange={(v) => update({ fontSize: v })}
          unit="px"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Font Weight</label>
        <div className="flex gap-2">
          {WEIGHTS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => update({ fontWeight: w.value })}
              className={cn(
                "flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                (value.fontWeight ?? 400) === w.value
                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
              )}
              style={{ fontWeight: w.value }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ColorInput
          label="Color"
          value={value.color ?? ""}
          onChange={(v) => update({ color: v })}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Alignment</label>
          <div className="flex gap-2">
            {ALIGNS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => update({ align: a.value })}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                  (value.align ?? "center") === a.value
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <Toggle
          checked={value.italic ?? false}
          onChange={(v) => update({ italic: v })}
          label="Italic"
        />
        <Toggle
          checked={value.underline ?? false}
          onChange={(v) => update({ underline: v })}
          label="Underline"
        />
      </div>
    </div>
  );
}
