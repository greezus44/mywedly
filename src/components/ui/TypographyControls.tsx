import React from "react";
import { cn } from "../../lib/utils";
import type { TypographyStyle } from "../../lib/typography";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { FontSelect } from "./FontSelect";
import { Input } from "./Input";
import { RangeInput } from "./index";
import { ColorInput } from "./index";
import { Toggle } from "./index";

export interface TypographyControlsProps {
  label: string;
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  showText?: boolean;
  className?: string;
}

const WEIGHTS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
];

const ALIGNMENTS = [
  { label: "Left", value: "left", icon: "M3.75 5.25h16.5m-16.5 4.5h12m-12 4.5h16.5m-16.5 4.5h12" },
  { label: "Centre", value: "center", icon: "M7.5 5.25h9m-12 4.5h15m-15 4.5h12m-9 4.5h6" },
  { label: "Right", value: "right", icon: "M7.5 5.25h16.5m-4.5 4.5h-12m16.5 4.5H7.5m4.5 4.5h-12" },
];

export function TypographyControls({
  label,
  value,
  onChange,
  showText = false,
  className,
}: TypographyControlsProps) {
  function update<K extends keyof TypographyStyle>(key: K, val: TypographyStyle[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface p-3", className)}>
      <div className="mb-3 text-sm font-semibold text-dash-text">{label}</div>

      <div className="space-y-3">
        {showText && (
          <Input
            label="Text"
            value={value.text ?? ""}
            onChange={(e) => update("text", e.target.value)}
            placeholder="Enter text…"
          />
        )}

        <FontSelect
          label="Font family"
          value={value.fontFamily ?? ""}
          onChange={(v) => update("fontFamily", v)}
          options={HEADING_FONT_OPTIONS}
          placeholder="Select a font…"
        />

        <RangeInput
          label="Font size"
          value={value.fontSize ?? 16}
          onChange={(v) => update("fontSize", v)}
          min={8}
          max={72}
          step={1}
          unit="px"
        />

        {/* Font weight */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-dash-text">Font weight</span>
          <div className="flex gap-1">
            {WEIGHTS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => update("fontWeight", w.value)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors",
                  (value.fontWeight ?? 400) === w.value
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

        {/* Text colour */}
        <ColorInput
          label="Text colour"
          value={value.color ?? "#000000"}
          onChange={(v) => update("color", v)}
        />

        {/* Text alignment */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-dash-text">Text alignment</span>
          <div className="flex gap-1">
            {ALIGNMENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                title={a.label}
                onClick={() => update("align", a.value)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 transition-colors",
                  (value.align ?? "left") === a.value
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-text hover:bg-dash-bg"
                )}
              >
                <svg className="mx-auto h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Italic + Underline toggles */}
        <div className="flex gap-4">
          <Toggle
            checked={!!value.italic}
            onChange={(v) => update("italic", v)}
            label="Italic"
          />
          <Toggle
            checked={!!value.underline}
            onChange={(v) => update("underline", v)}
            label="Underline"
          />
        </div>
      </div>
    </div>
  );
}
