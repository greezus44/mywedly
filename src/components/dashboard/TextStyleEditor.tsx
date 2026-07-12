import { useState } from "react";
import type { TextStyle } from "@/lib/text-styles";
import { styleFor } from "@/lib/text-styles";
import { Bold, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

export function TextStyleEditor({
  value,
  onChange,
  preview,
}: {
  value: TextStyle | undefined;
  onChange: (v: TextStyle) => void;
  preview: string;
}) {
  const v: TextStyle = value ?? {};
  const set = (patch: Partial<TextStyle>) => onChange({ ...v, ...patch });
  return (
    <div className="border border-onyx/10 bg-mist/20 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={v.family ?? ""}
          onChange={(e) => set({ family: (e.target.value || undefined) as TextStyle["family"] })}
          className="text-xs border border-onyx/20 bg-parchment px-2 py-1"
        >
          <option value="">Default font</option>
          <option value="serif">Serif</option>
          <option value="sans">Sans</option>
          <option value="system">System</option>
        </select>
        <select
          value={v.size ?? ""}
          onChange={(e) => set({ size: e.target.value ? Number(e.target.value) : undefined })}
          className="text-xs border border-onyx/20 bg-parchment px-2 py-1"
        >
          <option value="">Default size</option>
          {[11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 40, 48, 60].map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs">
          <span className="text-onyx/60">Color</span>
          <input
            type="color"
            value={v.color ?? "#8c7e6a"}
            onChange={(e) => set({ color: e.target.value })}
            className="w-8 h-7 border border-onyx/20 bg-transparent cursor-pointer"
          />
          {v.color && (
            <button type="button" onClick={() => set({ color: undefined })} className="text-[10px] text-onyx/50 hover:text-onyx">clear</button>
          )}
        </label>
        <button
          type="button"
          onClick={() => set({ bold: !v.bold })}
          className={`w-8 h-7 border flex items-center justify-center ${v.bold ? "bg-onyx text-parchment border-onyx" : "border-onyx/20"}`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <div className="flex border border-onyx/20">
          {(["left", "center", "right"] as const).map((a) => {
            const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
            return (
              <button
                key={a}
                type="button"
                onClick={() => set({ align: a })}
                className={`w-7 h-7 flex items-center justify-center ${v.align === a ? "bg-onyx text-parchment" : ""}`}
                title={a}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-parchment border border-onyx/10 p-3">
        <p className="text-[10px] tracking-widest text-onyx/40 uppercase mb-2">Preview</p>
        <div className="text-sepia" style={styleFor(v)}>{preview}</div>
      </div>
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
  value: TextStyle | undefined;
  onChange: (v: TextStyle) => void;
  preview: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] tracking-widest uppercase text-onyx/50 hover:text-onyx"
      >
        {open ? "▼" : "▶"} {label} text style
      </button>
      {open && <div className="mt-2"><TextStyleEditor value={value} onChange={onChange} preview={preview} /></div>}
    </div>
  );
}
