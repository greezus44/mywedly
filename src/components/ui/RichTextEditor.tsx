import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButton {
  label: string;
  command: string;
  arg?: string;
  icon?: React.ReactNode;
}

const toolbarButtons: ToolbarButton[] = [
  { label: "Bold", command: "bold", icon: <strong>B</strong> },
  { label: "Italic", command: "italic", icon: <em>I</em> },
  { label: "Underline", command: "underline", icon: <u>U</u> },
  { label: "H1", command: "formatBlock", arg: "H1" },
  { label: "H2", command: "formatBlock", arg: "H2" },
  { label: "H3", command: "formatBlock", arg: "H3" },
  { label: "P", command: "formatBlock", arg: "P" },
  { label: "UL", command: "insertUnorderedList" },
  { label: "OL", command: "insertOrderedList" },
  { label: "Link", command: "createLink" },
  { label: "Quote", command: "formatBlock", arg: "BLOCKQUOTE" },
  { label: "Clear", command: "removeFormat" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value to the editor when it changes from outside
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    isInternalChange.current = true;
    const html = editorRef.current?.innerHTML ?? "";
    onChange(html);
  }, [onChange]);

  const execCommand = useCallback((cmd: string, arg?: string) => {
    editorRef.current?.focus();
    if (cmd === "createLink") {
      const url = window.prompt("Enter URL:");
      if (url) {
        document.execCommand("createLink", false, url);
      }
    } else {
      document.execCommand(cmd, false, arg);
    }
    handleInput();
  }, [handleInput]);

  return (
    <div
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg/50 px-2 py-1.5">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.label}
            onClick={() => execCommand(btn.command, btn.arg)}
            className="rounded px-2 py-1 text-xs font-medium text-dash-text hover:bg-dash-surface hover:text-dash-primary transition-colors"
          >
            {btn.icon ?? btn.label}
          </button>
        ))}
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[120px] px-4 py-3 text-sm text-dash-text focus:outline-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted/60"
        )}
      />
    </div>
  );
}
