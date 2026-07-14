import React from "react";
import { cn } from "../../lib/utils";
import { Input } from "./Input";
import { Select } from "./Input";
import { RangeInput } from "./index";
import { ColorInput } from "./index";
import { Toggle } from "./index";
import type { TypographyStyle } from "../../lib/typography";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";

interface TypographyControlsProps {
  label: string;
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  showText?: boolean;
}

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Centre", value: "center" },
  { label: "Right", value: "right" },
] as const;

const WEIGHT_OPTIONS = [
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Bold", value: 700 },
] as const;

export function TypographyControls({
  label,
  value,
  onChange,
  showText = true,
}: TypographyControlsProps) {
  const update = (patch: Partial<TypographyStyle>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-dash-text">{label}</span>
      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter text"
        />
      )}
      <Select
        label="Font Family"
        value={value.fontFamily ?? ""}
        onChange={(e) => update({ fontFamily: e.target.value })}
      >
        <option value="">Default</option>
        {HEADING_FONT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <RangeInput
        label="Font Size (px)"
        value={value.fontSize ?? 16}
        onChange={(v) => update({ fontSize: v })}
        min={8}
        max={72}
        step={1}
      />
      <div>
        <span className="block text-sm font-medium text-dash-text mb-1.5">Font Weight</span>
        <div className="flex gap-1">
          {WEIGHT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ fontWeight: opt.value })}
              className={cn(
                "flex-1 h-8 rounded border text-sm transition-colors",
                value.fontWeight === opt.value
                  ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ColorInput
        label="Text Colour"
        value={value.color ?? "#000000"}
        onChange={(v) => update({ color: v })}
      />
      <div>
        <span className="block text-sm font-medium text-dash-text mb-1.5">Text Alignment</span>
        <div className="flex gap-1">
          {ALIGN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ align: opt.value })}
              className={cn(
                "flex-1 h-8 rounded border text-sm transition-colors",
                value.align === opt.value
                  ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                  : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
              )}
            >
              {opt.label}
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
