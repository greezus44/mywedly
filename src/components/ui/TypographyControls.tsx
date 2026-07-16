import type { TypographyStyle } from "../../lib/typography";
import { Input } from "./Input";
import { FontSelect } from "./FontSelect";
import { ColorInput, RangeInput, Toggle } from "./index";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";

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
      <RangeInput
        label="Font Size"
        value={value.fontSize ?? 16}
        onChange={(v) => update({ fontSize: v })}
        min={8}
        max={72}
      />
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
        <label className="mb-1 block text-xs font-medium text-dash-muted">Colour</label>
        <ColorInput value={value.color ?? "#000000"} onChange={(v) => update({ color: v })} />
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
