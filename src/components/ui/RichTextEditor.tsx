import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { sanitizeHtml } from "../../lib/sanitize";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const execCommand = (command: string, value?: string) => {
  document.execCommand(command, false, value);
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string>(value);

  useEffect(() => {
    if (editorRef.current && lastValueRef.current !== value && editorRef.current.innerHTML !== value) {
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

  const wrapCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    execCommand(command, value);
    handleInput();
  }, [handleInput]);

  const toolbarButtons = [
    { label: "B", command: "bold", className: "font-bold" },
    { label: "I", command: "italic", className: "italic" },
    { label: "U", command: "underline", className: "underline" },
    { label: "S", command: "strikeThrough", className: "line-through" },
  ];

  return (
    <div className={cn("w-full rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => wrapCommand(btn.command)}
            className={cn(
              "h-8 w-8 rounded text-sm text-dash-text hover:bg-dash-bg",
              btn.className,
            )}
          >
            {btn.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapCommand("insertUnorderedList")}
          className="rounded px-2 py-1 text-sm text-dash-text hover:bg-dash-bg"
        >
          • List
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapCommand("insertOrderedList")}
          className="rounded px-2 py-1 text-sm text-dash-text hover:bg-dash-bg"
        >
          1. List
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <select
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            if (val) wrapCommand("formatBlock", val);
            e.target.value = "";
          }}
          defaultValue=""
          className="rounded border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text"
        >
          <option value="" disabled>Style</option>
          <option value="P">Paragraph</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
          <option value="BLOCKQUOTE">Quote</option>
        </select>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) wrapCommand("createLink", url);
          }}
          className="rounded px-2 py-1 text-sm text-dash-text hover:bg-dash-bg"
        >
          🔗 Link
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = window.prompt("Enter image URL:");
            if (url) wrapCommand("insertImage", url);
          }}
          className="rounded px-2 py-1 text-sm text-dash-text hover:bg-dash-bg"
        >
          🖼️ Image
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="rich-content min-h-[120px] p-3 text-sm text-dash-text focus:outline-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-dash-muted/50"
      />
    </div>
  );
};
