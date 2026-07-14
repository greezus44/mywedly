import type { TypographyStyle } from "../../lib/typography";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { Input } from "./Input";
import { FontSelect } from "./FontSelect";
import { cn } from "../../lib/utils";

interface TypographyControlsProps {
  label?: string;
  value: TypographyStyle;
  onChange: (v: TypographyStyle) => void;
  showText?: boolean;
}

function set<K extends keyof TypographyStyle>(
  current: TypographyStyle,
  key: K,
  val: TypographyStyle[K],
  onChange: (v: TypographyStyle) => void,
) {
  onChange({ ...current, [key]: val });
}

const alignOptions = ["left", "center", "right"] as const;
const weightOptions = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

export function TypographyControls({ label, value, onChange, showText }: TypographyControlsProps) {
  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-dash-text">{label}</p>}

      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => set(value, "text", e.target.value, onChange)}
        />
      )}

      <FontSelect
        label="Font Family"
        value={value.fontFamily ?? ""}
        onChange={(v) => set(value, "fontFamily", v, onChange)}
        options={HEADING_FONT_OPTIONS}
        placeholder="Inherit"
      />

      <div>
        <label className="block text-sm font-medium text-dash-text mb-1">
          Font Size: {value.fontSize ?? 16}px
        </label>
        <input
          type="range"
          min={8}
          max={72}
          step={1}
          value={value.fontSize ?? 16}
          onChange={(e) => set(value, "fontSize", Number(e.target.value), onChange)}
          className="w-full accent-dash-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-dash-text mb-1">Weight</label>
        <div className="flex gap-1">
          {weightOptions.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => set(value, "fontWeight", w.value, onChange)}
              className={cn(
                "flex-1 rounded border px-2 py-1 text-xs transition-colors",
                value.fontWeight === w.value
                  ? "border-dash-primary bg-dash-primary text-white"
                  : "border-dash-border bg-dash-surface text-dash-text hover:border-dash-primary/50",
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dash-text mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.color ?? "#000000"}
            onChange={(e) => set(value, "color", e.target.value, onChange)}
            className="h-8 w-10 rounded border border-dash-border cursor-pointer"
          />
          <input
            type="text"
            value={value.color ?? ""}
            onChange={(e) => set(value, "color", e.target.value, onChange)}
            placeholder="#000000"
            className="flex-1 rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-xs text-dash-text focus:outline-none focus:ring-1 focus:ring-dash-primary/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dash-text mb-1">Alignment</label>
        <div className="flex gap-1">
          {alignOptions.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => set(value, "align", a, onChange)}
              className={cn(
                "flex flex-1 items-center justify-center rounded border py-1.5 transition-colors",
                value.align === a
                  ? "border-dash-primary bg-dash-primary text-white"
                  : "border-dash-border bg-dash-surface text-dash-text hover:border-dash-primary/50",
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {a === "left" && <path strokeLinecap="round" d="M3 6h18M3 12h12M3 18h15" />}
                {a === "center" && <path strokeLinecap="round" d="M3 6h18M6 12h12M4 18h16" />}
                {a === "right" && <path strokeLinecap="round" d="M3 6h18M9 12h12M6 18h15" />}
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-dash-text cursor-pointer">
          <input
            type="checkbox"
            checked={value.italic ?? false}
            onChange={(e) => set(value, "italic", e.target.checked, onChange)}
            className="accent-dash-primary"
          />
          Italic
        </label>
        <label className="flex items-center gap-2 text-sm text-dash-text cursor-pointer">
          <input
            type="checkbox"
            checked={value.underline ?? false}
            onChange={(e) => set(value, "underline", e.target.checked, onChange)}
            className="accent-dash-primary"
          />
          Underline
        </label>
      </div>
    </div>
  );
}
