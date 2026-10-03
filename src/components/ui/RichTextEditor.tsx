import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { RICH_FONT_OPTIONS } from "../../lib/theme";
import { sanitizeHtml } from "../../lib/sanitize";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  pixelFontSizes?: boolean;
}

const PIXEL_FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32].map((size) => ({ label: `${size}px`, value: String(size) }));
const LEGACY_FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "7" },
];

export function RichTextEditor({ value, onChange, placeholder, className, pixelFontSizes = false }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [customFontSize, setCustomFontSize] = useState("");

  const applyCustomFontSize = () => {
    if (!customFontSize) return;
    const val = Number(customFontSize);
    if (val >= 1 && val <= 200) exec("fontSize", String(val));
    setCustomFontSize("");
  };

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    const editor = ref.current;
    if (!selection || !editor || !selection.rangeCount || !selection.anchorNode || !selection.focusNode) return;
    if (!editor.contains(selection.anchorNode) || !editor.contains(selection.focusNode)) return;
    selectionRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    const range = selectionRef.current;
    if (!selection || !range) {
      ref.current?.focus();
      return;
    }
    ref.current?.focus();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const normalizeFontSizes = (fontSize: string) => {
    if (!ref.current) return;
    const selection = document.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    ref.current.querySelectorAll("font[size]").forEach((font) => {
      if (range && !range.intersectsNode(font)) return;
      const span = document.createElement("span");
      span.style.fontSize = `${fontSize}px`;
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
  };

  const clearFormatting = () => {
    restoreSelection();
    document.execCommand("removeFormat", false);
    const selection = document.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (range && ref.current) {
      const fragment = range.extractContents();
      fragment.querySelectorAll("span").forEach((span) => {
        const parent = span.parentElement;
        if (!parent) return;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        span.remove();
      });
      fragment.querySelectorAll("font").forEach((font) => {
        const parent = font.parentElement;
        if (!parent) return;
        while (font.firstChild) parent.insertBefore(font.firstChild, font);
        font.remove();
      });
      range.insertNode(fragment);
    }
    saveSelection();
    ref.current?.focus();
    updateActive();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const cleaned = html ? sanitizeHtml(html) : text.replace(/\n/g, "<br>");
    document.execCommand("insertHTML", false, cleaned);
  };

  const exec = (cmd: string, val?: string) => {
    restoreSelection();
    if (cmd === "fontSize" && pixelFontSizes) {
      document.execCommand("styleWithCSS", false, "false");
      document.execCommand(cmd, false, "7");
      normalizeFontSizes(val ?? "16");
    } else {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(cmd, false, val);
    }
    saveSelection();
    ref.current?.focus();
    updateActive();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const updateActive = () => {
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
    updateActive();
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      exec("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  const btn = (onClick: () => void, label: string, isActive = false, title = label) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
      onClick={onClick}
      className={cn("rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg", isActive && "bg-dash-primary/10 text-dash-primary")}
    >
      {label}
    </button>
  );

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        {btn(() => exec("bold"), "B", active.bold, "Bold")}
        {btn(() => exec("italic"), "I", active.italic, "Italic")}
        {btn(() => exec("underline"), "U", active.underline, "Underline")}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <select
          onMouseDown={() => saveSelection()}
          onChange={(e) => exec("fontSize", e.target.value)}
          title="Font size for selected text"
          aria-label="Font size for selected text"
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          defaultValue={pixelFontSizes ? "16" : "3"}
        >
          {(pixelFontSizes ? PIXEL_FONT_SIZES : LEGACY_FONT_SIZES).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {pixelFontSizes && (
          <input
            type="number"
            min={1}
            max={200}
            value={customFontSize}
            onMouseDown={() => saveSelection()}
            onChange={(e) => setCustomFontSize(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCustomFontSize(); } }}
            onBlur={applyCustomFontSize}
            placeholder="px"
            className="w-14 rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
            title="Custom font size (px)"
          />
        )}
        <select
          onMouseDown={() => saveSelection()}
          onChange={(e) => exec("fontName", e.target.value)}
          title="Font family for selected text"
          aria-label="Font family for selected text"
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          defaultValue=""
        >
          <option value="">Font</option>
          {RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>)}
        </select>
        <label className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-sm hover:bg-dash-bg">
          <span className="text-dash-muted">A</span>
          <input
            type="color"
            onMouseDown={() => saveSelection()}
            onChange={(e) => exec("foreColor", e.target.value)}
            title="Text colour for selected text"
            aria-label="Text colour for selected text"
            className="h-5 w-5 cursor-pointer border-0 p-0"
          />
        </label>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        {btn(() => { const url = prompt("Enter URL:"); if (url) exec("createLink", url); }, "Link", false, "Add link")}
        {btn(() => exec("insertUnorderedList"), "• List", active.insertUnorderedList, "Bulleted list")}
        {btn(() => exec("insertOrderedList"), "1. List", active.insertOrderedList, "Numbered list")}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        {btn(() => exec("justifyLeft"), "L", false, "Align left")}
        {btn(() => exec("justifyCenter"), "C", false, "Align centre")}
        {btn(() => exec("justifyRight"), "R", false, "Align right")}
        {btn(clearFormatting, "Clear", false, "Clear formatting from selected text")}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={() => { updateActive(); saveSelection(); }}
        onMouseUp={() => { updateActive(); saveSelection(); }}
        onSelect={saveSelection}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="rich-editor min-h-[150px] p-3 text-sm text-dash-text focus:outline-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-dash-muted/50"
      />
    </div>
  );
}
