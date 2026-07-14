import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const toolbarButtons = [
    { label: "B", command: "bold", className: "font-bold" },
    { label: "I", command: "italic", className: "italic" },
    { label: "U", command: "underline", className: "underline" },
  ];

  return (
    <div className={cn("w-full rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onMouseDown={handleMouseDown}
            onClick={() => execCommand(btn.command)}
            className={cn(
              "rounded px-2.5 py-1 text-sm text-dash-text hover:bg-dash-bg",
              btn.className,
            )}
            title={btn.command.charAt(0).toUpperCase() + btn.command.slice(1)}
          >
            {btn.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={() => execCommand("formatBlock", "<h2>")}
          className="rounded px-2.5 py-1 text-sm text-dash-text hover:bg-dash-bg"
          title="Heading"
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={() => execCommand("formatBlock", "<h3>")}
          className="rounded px-2.5 py-1 text-sm text-dash-text hover:bg-dash-bg"
          title="Subheading"
        >
          H3
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={() => execCommand("insertUnorderedList")}
          className="rounded px-2.5 py-1 text-sm text-dash-text hover:bg-dash-bg"
          title="Bullet list"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={() => execCommand("insertOrderedList")}
          className="rounded px-2.5 py-1 text-sm text-dash-text hover:bg-dash-bg"
          title="Numbered list"
        >
          1. List
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) execCommand("createLink", url);
          }}
          className="rounded px-2.5 py-1 text-sm text-dash-text hover:bg-dash-bg"
          title="Insert link"
        >
          🔗
        </button>
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onClick={() => execCommand("removeFormat")}
          className="rounded px-2.5 py-1 text-sm text-dash-text hover:bg-dash-bg"
          title="Clear formatting"
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[150px] px-4 py-3 text-sm text-dash-text focus:outline-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted/60",
        )}
      />
    </div>
  );
}
