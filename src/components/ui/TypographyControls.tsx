import type { TypographyStyle } from "../../lib/typography";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Input } from "./Input";
import { FontSelect } from "./FontSelect";
import { RangeInput } from "./index";
import { ColorInput } from "./index";
import { Toggle } from "./index";

export interface TypographyControlsProps {
  label?: string;
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  showText?: boolean;
  className?: string;
}

const FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

const ALIGNMENTS = [
  { label: "Left", value: "left", icon: "⟸" },
  { label: "Center", value: "center", icon: "≡" },
  { label: "Right", value: "right", icon: "⟹" },
];

export function TypographyControls({
  label,
  value,
  onChange,
  showText = false,
  className,
}: TypographyControlsProps) {
  const update = (patch: Partial<TypographyStyle>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text">{label}</label>
      )}

      {showText && (
        <Input
          label="Text"
          value={value.text || ""}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter text..."
        />
      )}

      <FontSelect
        label="Font Family"
        value={value.fontFamily || ""}
        onChange={(fontFamily) => update({ fontFamily })}
        options={HEADING_FONT_OPTIONS}
        placeholder="Select font"
      />

      <RangeInput
        label="Font Size"
        value={value.fontSize || 16}
        onChange={(fontSize) => update({ fontSize })}
        min={8}
        max={72}
        step={1}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Font Weight</label>
        <div className="flex gap-1">
          {FONT_WEIGHTS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => update({ fontWeight: w.value })}
              className={cn(
                "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                value.fontWeight === w.value
                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border text-dash-text hover:bg-dash-bg"
              )}
              style={{ fontWeight: w.value }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <ColorInput
        label="Text Colour"
        value={value.color || "#000000"}
        onChange={(color) => update({ color })}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">Text Alignment</label>
        <div className="flex gap-1">
          {ALIGNMENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => update({ align: a.value })}
              className={cn(
                "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                value.align === a.value
                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border text-dash-text hover:bg-dash-bg"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Toggle
          checked={!!value.italic}
          onChange={(italic) => update({ italic })}
          label="Italic"
        />
        <Toggle
          checked={!!value.underline}
          onChange={(underline) => update({ underline })}
          label="Underline"
        />
      </div>
    </div>
  );
}

export default TypographyControls;
