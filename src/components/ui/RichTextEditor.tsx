import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
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

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
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

  const toolbarButtons: { cmd: string; label: string; val?: string }[] = [
    { cmd: "bold", label: "B" },
    { cmd: "italic", label: "I" },
    { cmd: "underline", label: "U" },
    { cmd: "insertUnorderedList", label: "• List" },
    { cmd: "insertOrderedList", label: "1. List" },
    { cmd: "formatBlock", label: "H2", val: "<h2>" },
    { cmd: "formatBlock", label: "H3", val: "<h3>" },
    { cmd: "formatBlock", label: "P", val: "<p>" },
    { cmd: "createLink", label: "Link" },
    { cmd: "insertImage", label: "Image" },
  ];

  const handleToolbarClick = (e: React.MouseEvent, cmd: string, val?: string) => {
    e.preventDefault();
    if (cmd === "createLink") {
      const url = window.prompt("Enter URL:");
      if (url) exec(cmd, url);
    } else if (cmd === "insertImage") {
      const url = window.prompt("Enter image URL:");
      if (url) exec(cmd, url);
    } else {
      exec(cmd, val);
    }
  };

  return (
    <div className={cn("w-full rounded-md border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.cmd + btn.label}
            type="button"
            onMouseDown={(e) => handleToolbarClick(e, btn.cmd, btn.val)}
            className="rounded px-2 py-1 text-sm font-medium text-dash-text hover:bg-dash-bg"
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "rich-editor min-h-[120px] p-3 text-sm text-dash-text focus:outline-none",
          "[&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-dash-muted"
        )}
      />
    </div>
  );
}
