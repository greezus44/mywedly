import React, { useCallback, useRef } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  const exec = useCallback(
    (command: string, val?: string) => {
      document.execCommand(command, false, val);
      if (ref.current) onChange(ref.current.innerHTML);
    },
    [onChange]
  );

  const handleInput = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const tools = [
    { label: "B", command: "bold", style: "font-bold" },
    { label: "I", command: "italic", style: "italic" },
    { label: "U", command: "underline", style: "underline" },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        {tools.map((t) => (
          <button
            key={t.command}
            type="button"
            onClick={() => exec(t.command)}
            className={cn(
              "rounded px-2 py-1 text-sm hover:bg-dash-bg",
              t.style
            )}
          >
            {t.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h2>")}
          className="rounded px-2 py-1 text-sm hover:bg-dash-bg"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h3>")}
          className="rounded px-2 py-1 text-sm hover:bg-dash-bg"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<p>")}
          className="rounded px-2 py-1 text-sm hover:bg-dash-bg"
        >
          P
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="rounded px-2 py-1 text-sm hover:bg-dash-bg"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="rounded px-2 py-1 text-sm hover:bg-dash-bg"
        >
          1. List
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          className="rounded px-2 py-1 text-sm hover:bg-dash-bg"
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => exec("removeFormat")}
          className="rounded px-2 py-1 text-sm hover:bg-dash-bg"
        >
          Clear
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[120px] p-3 focus:outline-none",
          "[&[data-placeholder]:empty]:before:content-[attr(data-placeholder)]",
          "[&[data-placeholder]:empty]:before:text-dash-muted/60"
        )}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
