import React, { useRef, useCallback, useEffect } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: "S", value: "2", title: "Small" },
  { label: "N", value: "3", title: "Normal" },
  { label: "L", value: "5", title: "Large" },
  { label: "XL", value: "7", title: "X-Large" },
];

const FONT_FAMILIES = [
  { label: "Sans", value: "Arial, sans-serif" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Mono", value: "'Courier New', monospace" },
];

const COLORS = ["#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#6b7280"];

export function RichTextEditor({ value, onChange, label, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && isInternalChange.current === false) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const handleLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      exec("createLink", url);
    }
  }, [exec]);

  const toolbarBtn = (onClick: () => void, children: React.ReactNode, title: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="h-8 min-w-8 px-2 rounded border border-dash-border bg-dash-surface text-sm font-medium text-dash-text hover:bg-dash-bg transition-colors flex items-center justify-center"
    >
      {children}
    </button>
  );

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div className="rounded-md border border-dash-border bg-dash-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-dash-border bg-dash-bg">
          {toolbarBtn(() => exec("bold"), <b>B</b>, "Bold")}
          {toolbarBtn(() => exec("italic"), <i>I</i>, "Italic")}
          {toolbarBtn(() => exec("underline"), <u>U</u>, "Underline")}
          <div className="w-px h-6 bg-dash-border mx-1" />
          {FONT_SIZES.map((s) =>
            toolbarBtn(() => exec("fontSize", s.value), <span style={{ fontSize: `${10 + parseInt(s.value) * 2}px` }}>{s.label}</span>, s.title)
          )}
          <div className="w-px h-6 bg-dash-border mx-1" />
          {FONT_FAMILIES.map((f) =>
            toolbarBtn(() => exec("fontName", f.value), <span style={{ fontFamily: f.value }}>{f.label}</span>, f.label)
          )}
          <div className="w-px h-6 bg-dash-border mx-1" />
          <div className="relative inline-flex">
            <label
              title="Text Colour"
              className="h-8 w-8 rounded border border-dash-border cursor-pointer flex items-center justify-center overflow-hidden relative"
              style={{ background: "linear-gradient(180deg, transparent 50%, #333 50%)" }}
            >
              <span className="text-[10px] font-bold text-dash-text" style={{ textShadow: "0 0 2px white" }}>A</span>
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => exec("foreColor", e.target.value)}
                tabIndex={-1}
              />
            </label>
          </div>
          {toolbarBtn(handleLink, "🔗", "Insert link")}
          <div className="w-px h-6 bg-dash-border mx-1" />
          {toolbarBtn(() => exec("insertUnorderedList"), "• ☰", "Bullet list")}
          {toolbarBtn(() => exec("insertOrderedList"), "1. ☰", "Numbered list")}
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          className={cn(
            "min-h-[120px] p-3 text-sm text-dash-text outline-none",
            "prose prose-sm max-w-none",
            "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted"
          )}
        />
      </div>
    </div>
  );
}
