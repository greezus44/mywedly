import { useRef, useEffect, useCallback, type MouseEvent } from "react";
import { cn } from "../../lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

type CommandType =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "createLink"
  | "insertImage"
  | "removeFormat";

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "6" },
];

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b0b0b0", "#cccccc", "#ffffff",
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e",
];

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Set initial content and sync external value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Enable CSS styling for execCommand
  useEffect(() => {
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      // Some browsers don't support this — ignore
    }
  }, []);

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleToolbarMouseDown = useCallback((e: MouseEvent) => {
    // Prevent toolbar clicks from stealing focus from the editor
    e.preventDefault();
  }, []);

  function handleFontSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    exec("fontSize", e.target.value);
  }

  function handleColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    exec("foreColor", e.target.value);
  }

  function handleLink() {
    const url = window.prompt("Enter URL:");
    if (url) exec("createLink", url);
  }

  function handleImage() {
    const url = window.prompt("Enter image URL:");
    if (url) exec("insertImage", url);
  }

  function handleClearFormatting() {
    exec("removeFormat");
  }

  const toolbarButtonClass =
    "flex h-8 w-8 items-center justify-center rounded text-dash-text hover:bg-dash-bg transition-colors";

  return (
    <div className={cn("w-full rounded-lg border border-dash-border bg-dash-surface", className)}>
      {/* Toolbar */}
      <div
        onMouseDown={handleToolbarMouseDown}
        className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2"
      >
        {/* Bold */}
        <button type="button" onClick={() => exec("bold")} className={cn(toolbarButtonClass, "font-bold")} title="Bold">
          B
        </button>
        {/* Italic */}
        <button type="button" onClick={() => exec("italic")} className={cn(toolbarButtonClass, "italic")} title="Italic">
          I
        </button>
        {/* Underline */}
        <button type="button" onClick={() => exec("underline")} className={cn(toolbarButtonClass, "underline")} title="Underline">
          U
        </button>
        {/* Strikethrough */}
        <button type="button" onClick={() => exec("strikeThrough")} className={cn(toolbarButtonClass, "line-through")} title="Strikethrough">
          S
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Bullet list */}
        <button type="button" onClick={() => exec("insertUnorderedList")} className={toolbarButtonClass} title="Bullet list">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" />
          </svg>
        </button>
        {/* Numbered list */}
        <button type="button" onClick={() => exec("insertOrderedList")} className={toolbarButtonClass} title="Numbered list">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 6h12M7 12h12M7 18h12M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Alignment */}
        <button type="button" onClick={() => exec("justifyLeft")} className={toolbarButtonClass} title="Align left">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" />
          </svg>
        </button>
        <button type="button" onClick={() => exec("justifyCenter")} className={toolbarButtonClass} title="Align center">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M5 18h14" />
          </svg>
        </button>
        <button type="button" onClick={() => exec("justifyRight")} className={toolbarButtonClass} title="Align right">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M10 12h10M6 18h14" />
          </svg>
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Font size */}
        <select
          onChange={handleFontSizeChange}
          defaultValue="3"
          className="h-8 rounded border border-dash-border bg-dash-surface px-1 text-xs text-dash-text focus:outline-none focus:ring-1 focus:ring-dash-primary"
          title="Font size"
        >
          {FONT_SIZES.map((fs) => (
            <option key={fs.value} value={fs.value}>
              {fs.label}
            </option>
          ))}
        </select>

        {/* Color picker */}
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className={cn(toolbarButtonClass, "relative")}
          title="Text color"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 8l-2 8a4 4 0 008 0l-2-8M9 4h6" />
          </svg>
          <input
            ref={colorInputRef}
            type="color"
            onChange={handleColorChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            title="Text color"
          />
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Link */}
        <button type="button" onClick={handleLink} className={toolbarButtonClass} title="Insert link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        {/* Image */}
        <button type="button" onClick={handleImage} className={toolbarButtonClass} title="Insert image">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Clear formatting */}
        <button type="button" onClick={handleClearFormatting} className={toolbarButtonClass} title="Clear formatting">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
          </svg>
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          "min-h-[120px] max-w-none overflow-auto p-4 text-sm text-dash-text focus:outline-none",
          "[&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-dash-muted"
        )}
      />
    </div>
  );
}
