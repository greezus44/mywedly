import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "7" },
];

const FONT_FAMILIES = [
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Cardo", value: "'Cardo', serif" },
  { label: "Cormorant", value: "'Cormorant Garamond', serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Playfair", value: "'Playfair Display', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
];

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder = "Start typing…",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !focused) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, focused]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  const btnClass =
    "rounded p-1.5 text-dash-text hover:bg-dash-bg transition-colors";
  const dividerClass = "w-px h-6 bg-dash-border mx-0.5";

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-dash-border p-2">
        <button type="button" className={btnClass} onClick={() => exec("bold")} title="Bold">
          <span className="font-bold">B</span>
        </button>
        <button type="button" className={btnClass} onClick={() => exec("italic")} title="Italic">
          <span className="italic">I</span>
        </button>
        <button type="button" className={btnClass} onClick={() => exec("underline")} title="Underline">
          <span className="underline">U</span>
        </button>
        <div className={dividerClass} />
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          title="Font size"
          defaultValue="3"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          onChange={(e) => exec("fontName", e.target.value)}
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          title="Font family"
          defaultValue="'EB Garamond', serif"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <div className={dividerClass} />
        <input
          type="color"
          onChange={(e) => exec("foreColor", e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border border-dash-border"
          title="Text color"
        />
        <div className={dividerClass} />
        <button
          type="button"
          className={btnClass}
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          title="Insert link"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <div className={dividerClass} />
        <button type="button" className={btnClass} onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h.01M4 12h.01M4 18h.01M7 6h13M7 12h13M7 18h13" />
          </svg>
        </button>
        <button type="button" className={btnClass} onClick={() => exec("insertOrderedList")} title="Numbered list">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          handleInput();
        }}
        data-placeholder={placeholder}
        className="rich-content min-h-[120px] px-4 py-3 outline-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-dash-muted"
      />
    </div>
  );
}

export default RichTextEditor;
