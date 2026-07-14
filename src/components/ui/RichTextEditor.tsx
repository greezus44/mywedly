import { useRef, useEffect, useCallback, type MouseEvent } from "react";
import { RICH_FONT_OPTIONS } from "../../lib/theme";
import { FontSelect } from "./FontSelect";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Medium", value: "4" },
  { label: "Large", value: "5" },
  { label: "X-Large", value: "6" },
  { label: "XX-Large", value: "7" },
];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fontColorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const handleInput = () => { if (ref.current) onChange(ref.current.innerHTML); };

  const handleLink = () => {
    const url = window.prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  const handleFontColor = (e: MouseEvent) => {
    e.preventDefault();
    fontColorRef.current?.click();
  };

  const handleFontColorChange = () => {
    if (fontColorRef.current) exec("foreColor", fontColorRef.current.value);
  };

  const btnClass = "flex h-8 w-8 items-center justify-center rounded text-sm text-dash-text hover:bg-dash-bg transition-colors";

  return (
    <div className="overflow-hidden rounded-lg border border-dash-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-surface px-2 py-1.5">
        <button type="button" className={btnClass} title="Bold" onClick={() => exec("bold")}><b>B</b></button>
        <button type="button" className={btnClass} title="Italic" onClick={() => exec("italic")}><i>I</i></button>
        <button type="button" className={btnClass} title="Underline" onClick={() => exec("underline")}><u>U</u></button>
        <div className="h-5 w-px bg-dash-border" />
        <select onChange={(e) => exec("fontSize", e.target.value)} className="rounded text-xs text-dash-text border border-dash-border bg-dash-surface px-1 py-1" defaultValue="3">
          {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="h-5 w-px bg-dash-border" />
        <div className="w-36">
          <FontSelect value="" onChange={(v) => exec("fontName", v)} options={RICH_FONT_OPTIONS} placeholder="Font" />
        </div>
        <div className="h-5 w-px bg-dash-border" />
        <button type="button" className={btnClass} title="Text Color" onClick={handleFontColor}>
          <span className="flex items-center">
            <span className="text-xs">A</span>
            <span className="ml-0.5 h-2 w-3 rounded-sm border border-dash-border" style={{ backgroundColor: "#000" }} />
          </span>
        </button>
        <input ref={fontColorRef} type="color" className="hidden" onChange={handleFontColorChange} />
        <button type="button" className={btnClass} title="Link" onClick={handleLink}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
        <div className="h-5 w-px bg-dash-border" />
        <button type="button" className={btnClass} title="Bullet List" onClick={() => exec("insertUnorderedList")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" /></svg>
        </button>
        <button type="button" className={btnClass} title="Numbered List" onClick={() => exec("insertOrderedList")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 6h12M7 12h12M7 18h12M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </button>
        <div className="h-5 w-px bg-dash-border" />
        <button type="button" className={btnClass} title="Align Left" onClick={() => exec("justifyLeft")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" /></svg>
        </button>
        <button type="button" className={btnClass} title="Align Center" onClick={() => exec("justifyCenter")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M5 18h14" /></svg>
        </button>
        <button type="button" className={btnClass} title="Align Right" onClick={() => exec("justifyRight")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M10 12h10M6 18h14" /></svg>
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[200px] w-full bg-white p-3 text-sm text-dash-text focus:outline-none",
          "[&_.ql-snow]:border-0",
          "data-[empty=true]:before:content-[attr(data-placeholder)] data-[empty=true]:before:text-dash-muted"
        )}
        style={{ fontFamily: "var(--event-font-rich, Georgia, serif)" }}
      />
    </div>
  );
}
