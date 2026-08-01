import { ColorInput } from "./index";

export interface ButtonColors {
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
  hoverBorderColor?: string;
}

interface ButtonColourEditorProps {
  label?: string;
  value: ButtonColors;
  onChange: (v: ButtonColors) => void;
}

export function ButtonColourEditor({ label, value, onChange }: ButtonColourEditorProps) {
  const update = (patch: Partial<ButtonColors>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3 rounded-lg border border-dash-border bg-dash-surface p-4">
      {label && <h4 className="text-sm font-semibold text-dash-text">{label}</h4>}
      <div>
        <p className="mb-2 text-xs font-medium text-dash-muted">Normal</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Background</label>
            <ColorInput value={value.bgColor ?? ""} onChange={(v) => update({ bgColor: v })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Text</label>
            <ColorInput value={value.textColor ?? ""} onChange={(v) => update({ textColor: v })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Border</label>
            <ColorInput value={value.borderColor ?? ""} onChange={(v) => update({ borderColor: v })} />
          </div>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-dash-muted">Hover</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Background</label>
            <ColorInput value={value.hoverBgColor ?? ""} onChange={(v) => update({ hoverBgColor: v })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Text</label>
            <ColorInput value={value.hoverTextColor ?? ""} onChange={(v) => update({ hoverTextColor: v })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Border</label>
            <ColorInput value={value.hoverBorderColor ?? ""} onChange={(v) => update({ hoverBorderColor: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function buttonColorsToStyle(colors: ButtonColors | undefined): React.CSSProperties {
  if (!colors) return {};
  const style: React.CSSProperties = {};
  if (colors.bgColor) style.backgroundColor = colors.bgColor;
  if (colors.textColor) style.color = colors.textColor;
  if (colors.borderColor) { style.borderColor = colors.borderColor; style.borderStyle = "solid"; }
  return style;
}

export function buttonColorsToHoverStyle(colors: ButtonColors | undefined): React.CSSProperties {
  if (!colors) return {};
  const style: React.CSSProperties = {};
  if (colors.hoverBgColor) style.backgroundColor = colors.hoverBgColor;
  if (colors.hoverTextColor) style.color = colors.hoverTextColor;
  if (colors.hoverBorderColor) { style.borderColor = colors.hoverBorderColor; style.borderStyle = "solid"; }
  return style;
}
