import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { sanitizeHtml } from "../../lib/sanitize";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

type Command =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock"
  | "createLink"
  | "insertImage"
  | "removeFormat"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight";

function exec(command: Command, value?: string) {
  document.execCommand(command, false, value);
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  readOnly,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string>(value);

  // Initialize content once and when value changes externally
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    lastValueRef.current = html;
    onChange(html);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const wrap = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (readOnly) return;
    // keep focus in the editor
    editorRef.current?.focus();
    fn();
    handleInput();
  };

  const onLink = wrap(() => {
    const url = window.prompt("Enter URL:");
    if (url) exec("createLink", url);
  });

  const onImage = wrap(() => {
    const url = window.prompt("Enter image URL:");
    if (url) exec("insertImage", url);
  });

  const onBlock = (tag: string) =>
    wrap(() => {
      exec("formatBlock", tag);
    });

  const btnClass =
    "rounded p-1.5 text-dash-muted hover:bg-dash-bg hover:text-dash-text transition-colors";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-dash-border bg-dash-surface",
        className,
      )}
    >
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-dash-border bg-dash-bg/50 px-2 py-1">
          <button type="button" className={btnClass} title="Bold" onMouseDown={wrap(() => exec("bold"))}>
            <span className="text-sm font-bold">B</span>
          </button>
          <button type="button" className={btnClass} title="Italic" onMouseDown={wrap(() => exec("italic"))}>
            <span className="text-sm italic">I</span>
          </button>
          <button type="button" className={btnClass} title="Underline" onMouseDown={wrap(() => exec("underline"))}>
            <span className="text-sm underline">U</span>
          </button>
          <button type="button" className={btnClass} title="Strikethrough" onMouseDown={wrap(() => exec("strikeThrough"))}>
            <span className="text-sm line-through">S</span>
          </button>
          <div className="mx-1 h-5 w-px bg-dash-border" />
          <button type="button" className={btnClass} title="Heading 1" onMouseDown={onBlock("H1")}>
            <span className="text-xs font-bold">H1</span>
          </button>
          <button type="button" className={btnClass} title="Heading 2" onMouseDown={onBlock("H2")}>
            <span className="text-xs font-bold">H2</span>
          </button>
          <button type="button" className={btnClass} title="Paragraph" onMouseDown={onBlock("P")}>
            <span className="text-xs">¶</span>
          </button>
          <div className="mx-1 h-5 w-px bg-dash-border" />
          <button type="button" className={btnClass} title="Bullet list" onMouseDown={wrap(() => exec("insertUnorderedList"))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" /></svg>
          </button>
          <button type="button" className={btnClass} title="Numbered list" onMouseDown={wrap(() => exec("insertOrderedList"))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h12M7 12h12M7 18h12M3 6h.01M3 12h.01M3 18h.01" /></svg>
          </button>
          <div className="mx-1 h-5 w-px bg-dash-border" />
          <button type="button" className={btnClass} title="Align left" onMouseDown={wrap(() => exec("justifyLeft"))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
          </button>
          <button type="button" className={btnClass} title="Align center" onMouseDown={wrap(() => exec("justifyCenter"))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
          </button>
          <button type="button" className={btnClass} title="Align right" onMouseDown={wrap(() => exec("justifyRight"))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
          </button>
          <div className="mx-1 h-5 w-px bg-dash-border" />
          <button type="button" className={btnClass} title="Link" onMouseDown={onLink}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </button>
          <button type="button" className={btnClass} title="Image" onMouseDown={onImage}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          <button type="button" className={btnClass} title="Clear formatting" onMouseDown={wrap(() => exec("removeFormat"))}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 6v12M14 6l6 12M3 18h8" /></svg>
          </button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[120px] px-4 py-3 text-sm text-dash-text focus:outline-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted [&:empty]:before:opacity-60",
        )}
      />
    </div>
  );
};

// Helper to get sanitized HTML for display
export function sanitizeEditorHtml(html: string): string {
  return sanitizeHtml(html);
}
