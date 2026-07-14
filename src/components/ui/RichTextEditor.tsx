import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  // Sync external value when not focused
  useEffect(() => {
    if (editorRef.current && !focused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, focused]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const toolbarButtons = [
    { label: "B", command: "bold", className: "font-bold" },
    { label: "I", command: "italic", className: "italic" },
    { label: "U", command: "underline", className: "underline" },
    { label: "S", command: "strikeThrough", className: "line-through" },
  ] as const;

  const blockButtons = [
    { label: "H1", command: "formatBlock", value: "h1" },
    { label: "H2", command: "formatBlock", value: "h2" },
    { label: "H3", command: "formatBlock", value: "h3" },
    { label: "P", command: "formatBlock", value: "p" },
  ] as const;

  const listButtons = [
    { label: "• List", command: "insertUnorderedList" },
    { label: "1. List", command: "insertOrderedList" },
  ] as const;

  const handleLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) execCommand("createLink", url);
    handleInput();
  };

  const handleClearFormatting = () => {
    execCommand("removeFormat");
    handleInput();
  };

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              execCommand(btn.command);
              handleInput();
            }}
            className={cn(
              "rounded px-2 py-1 text-sm text-dash-text hover:bg-dash-surface transition-colors",
              btn.className
            )}
          >
            {btn.label}
          </button>
        ))}
        <div className="w-px h-5 bg-dash-border mx-1" />
        {blockButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              execCommand(btn.command, btn.value);
              handleInput();
            }}
            className="rounded px-2 py-1 text-xs font-medium text-dash-text hover:bg-dash-surface transition-colors"
          >
            {btn.label}
          </button>
        ))}
        <div className="w-px h-5 bg-dash-border mx-1" />
        {listButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              execCommand(btn.command);
              handleInput();
            }}
            className="rounded px-2 py-1 text-xs text-dash-text hover:bg-dash-surface transition-colors"
          >
            {btn.label}
          </button>
        ))}
        <div className="w-px h-5 bg-dash-border mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="rounded px-2 py-1 text-xs text-dash-text hover:bg-dash-surface transition-colors"
        >
          Link
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormatting}
          className="rounded px-2 py-1 text-xs text-dash-text hover:bg-dash-surface transition-colors"
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[120px] px-3 py-2 text-sm text-dash-text focus:outline-none",
          "[&[data-placeholder]]:empty:before:content-[attr(data-placeholder)] [&[data-placeholder]]:empty:before:text-dash-muted/60"
        )}
      />
    </div>
  );
}
