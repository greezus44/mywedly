import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value into the editor if it differs
  useEffect(() => {
    if (ref.current && !isInternalChange.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (ref.current) {
      isInternalChange.current = true;
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      isInternalChange.current = true;
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  const tools = [
    { label: "B", cmd: "bold", title: "Bold" },
    { label: "I", cmd: "italic", title: "Italic" },
    { label: "U", cmd: "underline", title: "Underline" },
    { label: "S", cmd: "strikeThrough", title: "Strikethrough" },
    { label: "H1", cmd: "formatBlock", val: "h1", title: "Heading 1" },
    { label: "H2", cmd: "formatBlock", val: "h2", title: "Heading 2" },
    { label: "P", cmd: "formatBlock", val: "p", title: "Paragraph" },
    { label: "•", cmd: "insertUnorderedList", title: "Bullet list" },
    { label: "1.", cmd: "insertOrderedList", title: "Numbered list" },
    { label: "❝", cmd: "formatBlock", val: "blockquote", title: "Quote" },
    { label: "🔗", cmd: "createLink", title: "Insert link" },
    { label: "🖼", cmd: "insertImage", title: "Insert image" },
  ];

  return (
    <div className={cn("rounded-xl border border-dash-border bg-dash-surface overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onClick={() => {
              if (t.cmd === "createLink") {
                const url = window.prompt("Enter URL:");
                if (url) exec(t.cmd, url);
              } else if (t.cmd === "insertImage") {
                const url = window.prompt("Enter image URL:");
                if (url) exec(t.cmd, url);
              } else {
                exec(t.cmd, t.val);
              }
            }}
            className="min-w-[28px] rounded px-2 py-1 text-sm font-medium text-dash-text hover:bg-dash-surface hover:text-dash-primary"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-content min-h-[120px] px-4 py-3 outline-none empty:before:text-dash-muted empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
