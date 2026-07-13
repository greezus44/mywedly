import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, RotateCcw } from "lucide-react";
import type { TextStyle, TypographySettings, WeddingContent } from "@/lib/supabase";
import {
  FONT_OPTIONS, FONT_WEIGHTS, TEXT_TRANSFORMS, TEXT_ALIGNS,
  TEXT_ELEMENTS, DEFAULT_GLOBAL_TYPOGRAPHY,
  styleFor, contrastWarning, getElementStyle,
} from "@/lib/text-styles";

type Props = {
  content: WeddingContent;
  onChange: (typography: TypographySettings) => void;
};

export function TextStyleEditor({ content, onChange }: Props) {
  const typography = content.typography ?? {
    global: DEFAULT_GLOBAL_TYPOGRAPHY,
    elements: (content.text_styles ?? {}) as Record<string, TextStyle>,
  };

  const updateGlobal = (prop: keyof TextStyle, value: string) => {
    onChange({ ...typography, global: { ...typography.global, [prop]: value } });
  };

  const updateElement = (key: string, prop: keyof TextStyle, value: string) => {
    const current = typography.elements[key] ?? {};
    onChange({
      ...typography,
      elements: { ...typography.elements, [key]: { ...current, [prop]: value } },
    });
  };

  const resetElement = (key: string) => {
    const next = { ...typography.elements };
    delete next[key];
    onChange({ ...typography, elements: next });
  };

  const [openGroup, setOpenGroup] = useState<string | null>("Cover Page");

  const groups = Array.from(new Set(TEXT_ELEMENTS.map((e) => e.group)));
  const bgColor = (content.cover_background_url as string) ? "#ffffff" : "#fdfcf9";

  return (
    <div className="space-y-8">
      <GlobalTypographyEditor global={typography.global} onChange={updateGlobal} bgColor={bgColor} />
      <section>
        <h3 className="text-sm uppercase tracking-widest text-sepia mb-4">Individual Elements</h3>
        <div className="space-y-1">
          {groups.map((group) => {
            const elems = TEXT_ELEMENTS.filter((e) => e.group === group);
            const isOpen = openGroup === group;
            return (
              <div key={group} className="border border-onyx/10 rounded-md overflow-hidden">
                <button
                  onClick={() => setOpenGroup(isOpen ? null : group)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-mist/50 hover:bg-mist transition-colors text-left"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4 text-sepia" /> : <ChevronRight className="w-4 h-4 text-sepia" />}
                  <span className="text-sm font-medium text-onyx">{group}</span>
                  <span className="text-xs text-sepia/50 ml-auto">{elems.length} elements</span>
                </button>
                {isOpen && (
                  <div className="p-4 space-y-4">
                    {elems.map((elem) => (
                      <ElementEditor
                        key={elem.key}
                        label={elem.label}
                        elemKey={elem.key}
                        typography={typography}
                        onChange={updateElement}
                        onReset={resetElement}
                        bgColor={bgColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function GlobalTypographyEditor({ global, onChange, bgColor }: { global: TextStyle; onChange: (prop: keyof TextStyle, value: string) => void; bgColor: string }) {
  return (
    <section className="border border-onyx/10 bg-card p-6 rounded-md">
      <h3 className="text-sm uppercase tracking-widest text-sepia mb-4">Global Typography</h3>
      <p className="text-xs text-sepia/60 mb-4">These settings apply to all text elements. Individual element overrides take precedence.</p>
      <StyleControls style={global} onChange={onChange} bgColor={bgColor} showAdvanced />
    </section>
  );
}

function ElementEditor({ label, elemKey, typography, onChange, onReset, bgColor }: {
  label: string; elemKey: string; typography: TypographySettings;
  onChange: (key: string, prop: keyof TextStyle, value: string) => void;
  onReset: (key: string) => void; bgColor: string;
}) {
  const style = getElementStyle({ typography } as WeddingContent, elemKey);
  const hasOverride = !!typography.elements[elemKey];

  return (
    <div className="border border-onyx/10 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-onyx">{label}</span>
        {hasOverride && (
          <button onClick={() => onReset(elemKey)} className="flex items-center gap-1 text-xs text-sepia hover:text-onyx">
            <RotateCcw className="w-3 h-3" /> Reset to global
          </button>
        )}
      </div>
      <StyleControls
        style={style}
        onChange={(prop, value) => onChange(elemKey, prop, value)}
        bgColor={bgColor}
      />
      <div className="mt-3 pt-3 border-t border-onyx/5">
        <p className="text-xs text-sepia/50 mb-1">Preview:</p>
        <p style={styleFor(style)} className="truncate">The quick brown fox jumps</p>
      </div>
    </div>
  );
}

function StyleControls({ style, onChange, bgColor, showAdvanced }: {
  style: TextStyle;
  onChange: (prop: keyof TextStyle, value: string) => void;
  bgColor: string;
  showAdvanced?: boolean;
}) {
  const [showMore, setShowMore] = useState(false);

  const warning = style.color ? contrastWarning(style.color, bgColor) : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Font Family</label>
          <select
            value={style.fontFamily ?? ""}
            onChange={(e) => onChange("fontFamily", e.target.value)}
            className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
          >
            <option value="">Default</option>
            {FONT_OPTIONS.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Weight</label>
          <select
            value={style.weight ?? ""}
            onChange={(e) => onChange("weight", e.target.value)}
            className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
          >
            <option value="">Default</option>
            {FONT_WEIGHTS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Size</label>
          <input
            value={style.size ?? ""}
            onChange={(e) => onChange("size", e.target.value)}
            placeholder="e.g. 1.5rem"
            className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Color</label>
          <div className="flex gap-1">
            <input
              type="color"
              value={style.color ?? "#1a1a1a"}
              onChange={(e) => onChange("color", e.target.value)}
              className="border border-onyx/20 p-1 h-9 w-10 rounded"
            />
            <input
              value={style.color ?? ""}
              onChange={(e) => onChange("color", e.target.value)}
              placeholder="#1a1a1a"
              className="flex-1 border border-onyx/20 p-2 text-sm bg-transparent rounded"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Style</label>
          <select
            value={style.fontStyle ?? "normal"}
            onChange={(e) => onChange("fontStyle", e.target.value)}
            className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Transform</label>
          <select
            value={style.textTransform ?? "none"}
            onChange={(e) => onChange("textTransform", e.target.value)}
            className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
          >
            {TEXT_TRANSFORMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Alignment</label>
          <select
            value={style.textAlign ?? "left"}
            onChange={(e) => onChange("textAlign", e.target.value)}
            className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
          >
            {TEXT_ALIGNS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-sepia/60">Letter Spacing</label>
          <input
            value={style.letterSpacing ?? ""}
            onChange={(e) => onChange("letterSpacing", e.target.value)}
            placeholder="e.g. 0.1em"
            className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
          />
        </div>
      </div>

      {warning && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">{warning}</p>
        </div>
      )}

      {showAdvanced && (
        <>
          <button
            onClick={() => setShowMore(!showMore)}
            className="text-xs text-sepia hover:text-onyx flex items-center gap-1"
          >
            {showMore ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Advanced
          </button>
          {showMore && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-sepia/60">Line Height</label>
                <input
                  value={style.lineHeight ?? ""}
                  onChange={(e) => onChange("lineHeight", e.target.value)}
                  placeholder="e.g. 1.5"
                  className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-sepia/60">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={style.opacity ?? "1"}
                  onChange={(e) => onChange("opacity", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-sepia/60">Text Shadow</label>
                <input
                  value={style.textShadow ?? ""}
                  onChange={(e) => onChange("textShadow", e.target.value)}
                  placeholder="e.g. 2px 2px 4px rgba(0,0,0,0.3)"
                  className="w-full border border-onyx/20 p-2 text-sm bg-transparent rounded"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
