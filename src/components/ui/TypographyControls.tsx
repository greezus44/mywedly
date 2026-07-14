import type { TypographyStyle } from "../../lib/typography";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { ColorInput } from "./index";
import { FontSelect } from "./FontSelect";
import { Input } from "./Input";
import { RangeInput } from "./index";
import { Toggle } from "./index";

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

const ALIGNMENTS = [
  { label: "Left", value: "left", icon: "M3.75 5.25h16.5m-16.5 4.5h9m-9 4.5h16.5m-16.5 4.5h9" },
  { label: "Centre", value: "center", icon: "M7.5 5.25h9m-12 4.5h15m-15 4.5h12m-9 4.5h9" },
  { label: "Right", value: "right", icon: "M7.5 5.25h16.5m-9 4.5h9m-16.5 4.5h9m-9 4.5h16.5" },
];

export function TypographyControls({
  label,
  value,
  onChange,
  showText = false,
}: TypographyControlsProps) {
  function update<K extends keyof TypographyStyle>(key: K, val: TypographyStyle[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-3">
      {label && (
        <span className="block text-sm font-medium text-dash-text">{label}</span>
      )}

      {/* Text content */}
      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => update("text", e.target.value)}
          placeholder="Enter text…"
        />
      )}

      {/* Font family */}
      <FontSelect
        label="Font Family"
        options={HEADING_FONT_OPTIONS}
        value={value.fontFamily ?? HEADING_FONT_OPTIONS[0].value}
        onChange={(v) => update("fontFamily", v)}
      />

      {/* Font size */}
      <RangeInput
        label="Font Size"
        min={8}
        max={72}
        step={1}
        unit="px"
        value={value.fontSize ?? 16}
        onChange={(e) => update("fontSize", parseInt(e.target.value, 10))}
      />

      {/* Font weight */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-dash-text">Font Weight</span>
        <div className="flex gap-2">
          {WEIGHTS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => update("fontWeight", w.value)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                value.fontWeight === w.value
                  ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
              )}
              style={{ fontWeight: w.value }}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text colour */}
      <ColorInput
        label="Text Colour"
        value={value.color ?? "#000000"}
        onChange={(v) => update("color", v)}
      />

      {/* Text alignment */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-dash-text">Text Alignment</span>
        <div className="flex gap-2">
          {ALIGNMENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => update("align", a.value)}
              className={cn(
                "flex h-9 flex-1 items-center justify-center rounded-md border transition-colors",
                value.align === a.value
                  ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
              )}
              title={a.label}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Italic & Underline toggles */}
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
