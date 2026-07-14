import { cn } from "../../lib/utils";
import { Input } from "./Input";
import { Select } from "./Input";
import { RangeInput } from "./index";
import { ColorInput } from "./index";
import { Toggle } from "./index";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import type { TypographyStyle } from "../../lib/typography";

interface TypographyControlsProps {
  label: string;
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  showText?: boolean;
}

const FONT_WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

const ALIGNMENTS = [
  { label: "Left", value: "left", icon: "L" },
  { label: "Centre", value: "center", icon: "C" },
  { label: "Right", value: "right", icon: "R" },
];

export function TypographyControls({
  label,
  value,
  onChange,
  showText = true,
}: TypographyControlsProps) {
  function update<K extends keyof TypographyStyle>(key: K, val: TypographyStyle[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-dash-text">{label}</div>

      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => update("text", e.target.value)}
          placeholder="Enter text"
        />
      )}

      <Select
        label="Font Family"
        value={value.fontFamily ?? ""}
        onChange={(e) => update("fontFamily", e.target.value)}
      >
        <option value="">Default</option>
        {HEADING_FONT_OPTIONS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </Select>

      <RangeInput
        label="Font Size (px)"
        value={value.fontSize ?? 16}
        onChange={(v) => update("fontSize", v)}
        min={8}
        max={72}
        step={1}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-dash-text">Font Weight</span>
        <div className="flex gap-1">
          {FONT_WEIGHTS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => update("fontWeight", w.value)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                value.fontWeight === w.value
                  ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <ColorInput
        label="Text Colour"
        value={value.color ?? "#000000"}
        onChange={(v) => update("color", v)}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-dash-text">Text Alignment</span>
        <div className="flex gap-1">
          {ALIGNMENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => update("align", a.value)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                value.align === a.value
                  ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Toggle
          label="Italic"
          checked={value.italic ?? false}
          onChange={(v) => update("italic", v)}
        />
        <Toggle
          label="Underline"
          checked={value.underline ?? false}
          onChange={(v) => update("underline", v)}
        />
      </div>
    </div>
  );
}

export default TypographyControls;
