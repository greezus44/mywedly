import React from "react";
import { cn } from "../../lib/utils";
import type { TypographyStyle } from "../../lib/typography";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { Input, Select, RangeInput, ColorInput, Toggle } from "./index";

interface TypographyControlsProps {
  label: string;
  value: TypographyStyle;
  onChange: (value: TypographyStyle) => void;
  showText?: boolean;
}

export const TypographyControls: React.FC<TypographyControlsProps> = ({
  label,
  value,
  onChange,
  showText = true,
}) => {
  const update = (patch: Partial<TypographyStyle>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-dash-text">{label}</div>

      {showText && (
        <Input
          label="Text"
          value={value.text ?? ""}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Enter text..."
        />
      )}

      <div className="space-y-3 rounded-md border border-dash-border p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-dash-muted">Typography</div>

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
          label="Font Size"
          value={value.fontSize ?? 16}
          onChange={(v) => update({ fontSize: v })}
          min={8}
          max={72}
          step={1}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Font Weight</label>
          <div className="flex gap-1">
            {[
              { label: "Regular", weight: 400 },
              { label: "Medium", weight: 500 },
              { label: "Bold", weight: 700 },
            ].map((w) => (
              <button
                key={w.weight}
                type="button"
                onClick={() => update({ fontWeight: w.weight })}
                className={cn(
                  "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                  value.fontWeight === w.weight
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-muted hover:bg-dash-bg",
                )}
                style={{ fontWeight: w.weight }}
              >
                {w.label}
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
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Text Alignment</label>
          <div className="flex gap-1">
            {[
              { label: "Left", value: "left" },
              { label: "Centre", value: "center" },
              { label: "Right", value: "right" },
            ].map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => update({ align: a.value })}
                className={cn(
                  "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                  value.align === a.value
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-muted hover:bg-dash-bg",
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
            onChange={(v) => update({ italic: v })}
            label="Italic"
          />
          <Toggle
            checked={!!value.underline}
            onChange={(v) => update({ underline: v })}
            label="Underline"
          />
        </div>
      </div>
    </div>
  );
};
