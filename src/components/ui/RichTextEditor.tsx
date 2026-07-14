import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";
import { RICH_FONT_OPTIONS, type FontOption } from "../../lib/theme";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Heading 3", value: "4" },
  { label: "Heading 2", value: "5" },
  { label: "Heading 1", value: "6" },
];

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [currentFont, setCurrentFont] = useState<string>("");
  const fontContainerRef = useRef<HTMLDivElement>(null);

  // Set initial HTML content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close font dropdown on outside click
  useEffect(() => {
    if (!fontOpen) return;
    function handle(e: MouseEvent) {
      if (fontContainerRef.current && !fontContainerRef.current.contains(e.target as Node)) {
        setFontOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [fontOpen]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }, []);

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function handleFontChange(fontStack: string) {
    exec("fontName", fontStack);
    setCurrentFont(fontStack);
    setFontOpen(false);
  }

  function createLink() {
    const url = window.prompt("Enter URL:");
    if (url) exec("createLink", url);
  }

  const selectedFontOption = RICH_FONT_OPTIONS.find((o) => o.value === currentFont);

  const toolbarBtn =
    "rounded p-1.5 text-dash-text hover:bg-dash-bg transition-colors";

  return (
    <div className={cn("w-full rounded-lg border border-dash-border bg-dash-surface", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        <button type="button" className={toolbarBtn} onClick={() => exec("bold")} title="Bold">
          <strong className="text-sm">B</strong>
        </button>
        <button type="button" className={toolbarBtn} onClick={() => exec("italic")} title="Italic">
          <em className="text-sm">I</em>
        </button>
        <button type="button" className={toolbarBtn} onClick={() => exec("underline")} title="Underline">
          <u className="text-sm">U</u>
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Font size */}
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          defaultValue="3"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Font family dropdown with font preview */}
        <div className="relative" ref={fontContainerRef}>
          <button
            type="button"
            onClick={() => setFontOpen((v) => !v)}
            className="flex items-center gap-1 rounded border border-dash-border bg-dash-surface px-2 py-1 text-xs text-dash-text hover:bg-dash-bg"
          >
            <span style={selectedFontOption ? { fontFamily: selectedFontOption.stack } : undefined}>
              {selectedFontOption ? selectedFontOption.label : "Font"}
            </span>
            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
          {fontOpen && (
            <div className="absolute z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-dash-border bg-dash-surface shadow-lg scrollbar-thin">
              {RICH_FONT_OPTIONS.map((opt: FontOption) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFontChange(opt.value)}
                  className="block w-full px-3 py-1.5 text-left text-xs text-dash-text hover:bg-dash-bg"
                  style={{ fontFamily: opt.stack }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Text color */}
        <input
          type="color"
          onChange={(e) => exec("foreColor", e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border border-dash-border"
          title="Text colour"
        />

        <div className="mx-1 h-5 w-px bg-dash-border" />

        <button type="button" className={toolbarBtn} onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>
        <button type="button" className={toolbarBtn} onClick={() => exec("insertOrderedList")} title="Numbered list">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h.007v.008H3.75V6zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>
        <button type="button" className={toolbarBtn} onClick={createLink} title="Insert link">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder || "Start typing…"}
        className="min-h-[120px] p-3 text-sm text-dash-text focus:outline-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-dash-muted/60"
      />
    </div>
  );
}
