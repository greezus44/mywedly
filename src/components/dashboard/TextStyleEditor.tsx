import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Type,
} from "lucide-react";
import { FONT_OPTIONS, WEIGHT_OPTIONS, type TextStyle } from "@/lib/text-styles";

export function TextStyleEditor({
  value,
  onChange,
  preview,
}: {
  value?: TextStyle;
  onChange: (s: TextStyle | undefined) => void;
  preview?: string;
}) {
  const v: TextStyle = value ?? {};
  const set = (patch: Partial<TextStyle>) => onChange({ ...v, ...patch });

  return (
    <div className="space-y-3 border border-onyx/10 p-4 bg-mist/20 rounded">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-onyx/50 block mb-1">
            Font Family
          </label>
          <select
            value={v.family ?? ""}
            onChange={(e) => set({ family: e.target.value || undefined })}
            className="w-full border border-onyx/20 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-onyx"
          >
            <option value="">Default</option>
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-onyx/50 block mb-1">
            Size
          </label>
          <select
            value={v.size ?? ""}
            onChange={(e) => set({ size: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-onyx/20 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-onyx"
          >
            <option value="">Default</option>
            {[10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80].map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-onyx/50 block mb-1">
            Weight
          </label>
          <select
            value={v.weight ?? ""}
            onChange={(e) => set({ weight: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-onyx/20 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-onyx"
          >
            <option value="">Default</option>
            {WEIGHT_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-onyx/50 block mb-1">
            Color
          </label>
          <div className="flex gap-1 items-center">
            <input
              type="color"
              value={v.color ?? "#1a1a1a"}
              onChange={(e) => set({ color: e.target.value })}
              className="w-8 h-7 border border-onyx/20 cursor-pointer"
            />
            <input
              value={v.color ?? ""}
              onChange={(e) => set({ color: e.target.value || undefined })}
              placeholder="Default"
              className="flex-1 border-b border-onyx/20 bg-transparent px-1 py-1 text-xs outline-none focus:border-onyx"
            />
            {v.color && (
              <button
                type="button"
                onClick={() => set({ color: undefined })}
                className="text-[10px] text-onyx/40 hover:text-onyx"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-onyx/50 block mb-1">
            Letter Spacing
          </label>
          <input
            value={v.letterSpacing ?? ""}
            onChange={(e) => set({ letterSpacing: e.target.value || undefined })}
            placeholder="0.1em"
            className="w-full border border-onyx/20 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-onyx"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-onyx/50 block mb-1">
            Line Height
          </label>
          <input
            type="number"
            step="0.1"
            value={v.lineHeight ?? ""}
            onChange={(e) =>
              set({ lineHeight: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="1.5"
            className="w-full border border-onyx/20 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-onyx"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-onyx/50 block mb-1">
            Transform
          </label>
          <select
            value={v.textTransform ?? ""}
            onChange={(e) =>
              set({ textTransform: (e.target.value || undefined) as TextStyle["textTransform"] })
            }
            className="w-full border border-onyx/20 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-onyx"
          >
            <option value="">Default</option>
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => set({ bold: !v.bold })}
          className={`p-1.5 border border-onyx/20 rounded ${v.bold ? "bg-onyx text-parchment" : "text-onyx/60"}`}
          aria-label="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        {(["left", "center", "right"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => set({ align: a })}
            className={`p-1.5 border border-onyx/20 rounded ${v.align === a ? "bg-onyx text-parchment" : "text-onyx/60"}`}
            aria-label={`Align ${a}`}
          >
            {a === "left" && <AlignLeft className="w-3.5 h-3.5" />}
            {a === "center" && <AlignCenter className="w-3.5 h-3.5" />}
            {a === "right" && <AlignRight className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>

      {preview && (
        <div className="border-t border-onyx/10 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-onyx/40 mb-1 flex items-center gap-1">
            <Type className="w-3 h-3" /> Preview
          </p>
          <p
            className="text-sm"
            style={{
              fontFamily: v.family || undefined,
              fontSize: v.size ? `${v.size}px` : undefined,
              color: v.color || undefined,
              fontWeight: v.weight ?? (v.bold ? 700 : undefined),
              textAlign: v.align,
              letterSpacing: v.letterSpacing,
              lineHeight: v.lineHeight ? `${v.lineHeight}` : undefined,
              textTransform: v.textTransform === "none" ? undefined : v.textTransform,
            }}
          >
            {preview}
          </p>
        </div>
      )}

      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-[10px] uppercase tracking-widest text-onyx/40 hover:text-destructive"
        >
          Reset style
        </button>
      )}
    </div>
  );
}

export function CollapsibleStyle({
  label,
  value,
  onChange,
  preview,
}: {
  label: string;
  value?: TextStyle;
  onChange: (s: TextStyle | undefined) => void;
  preview?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] uppercase tracking-widest text-onyx/40 hover:text-onyx flex items-center gap-1"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {label} style
      </button>
      {open && (
        <div className="mt-2">
          <TextStyleEditor value={value} onChange={onChange} preview={preview} />
        </div>
      )}
    </div>
  );
}
