import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { RICH_FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { FontSelect } from "./FontSelect";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Heading", value: "6" },
];

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value into the contentEditable when it changes externally
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter for clean paragraph insertion
    if (e.key === "Enter" && !e.shiftKey) {
      // Default behavior is fine; contentEditable handles it
    }
  }, []);

  const createLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) exec("createLink", url);
  }, [exec]);

  const setFontFamily = useCallback((fontStack: string) => {
    exec("fontName", fontStack);
  }, [exec]);

  const toolbarBtn =
    "flex h-8 w-8 items-center justify-center rounded text-sm text-dash-text hover:bg-dash-bg transition-colors";

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-dash-border bg-dash-surface", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        <button type="button" onClick={() => exec("bold")} className={toolbarBtn} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => exec("italic")} className={toolbarBtn} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => exec("underline")} className={toolbarBtn} title="Underline">
          <u>U</u>
        </button>

        <div className="mx-1 h-6 w-px bg-dash-border" />

        {/* Font size */}
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          className="h-8 rounded border border-dash-border bg-dash-surface px-1 text-xs text-dash-text"
          defaultValue="3"
          title="Font size"
        >
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        {/* Font family with preview */}
        <div className="min-w-[140px]">
          <FontSelect
            options={RICH_FONT_OPTIONS}
            value={RICH_FONT_OPTIONS[0].value}
            onChange={setFontFamily}
            placeholder="Font"
          />
        </div>

        <div className="mx-1 h-6 w-px bg-dash-border" />

        {/* Foreground color */}
        <label className="flex h-8 cursor-pointer items-center" title="Text colour">
          <span className="sr-only">Text colour</span>
          <input
            type="color"
            onChange={(e) => exec("foreColor", e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border border-dash-border"
            defaultValue="#000000"
          />
        </label>

        <button type="button" onClick={createLink} className={toolbarBtn} title="Insert link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.65-.688a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" />
          </svg>
        </button>

        <div className="mx-1 h-6 w-px bg-dash-border" />

        <button type="button" onClick={() => exec("insertUnorderedList")} className={toolbarBtn} title="Bullet list">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z" />
          </svg>
        </button>
        <button type="button" onClick={() => exec("insertOrderedList")} className={toolbarBtn} title="Numbered list">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h12M5 12h12M5 17h12M3 5.5v.01M3 10.5v.01M3 15.5v.01" />
          </svg>
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={cn(
          "rich-editor min-h-[120px] px-4 py-3 text-sm text-dash-text focus:outline-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted"
        )}
      />
    </div>
  );
}
