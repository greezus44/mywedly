import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder = "Write something...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const toolbarButtons = [
    { label: "B", command: "bold", title: "Bold" },
    { label: "I", command: "italic", title: "Italic" },
    { label: "U", command: "underline", title: "Underline" },
    { label: "S", command: "strikeThrough", title: "Strikethrough" },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface overflow-hidden",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            title={btn.title}
            onClick={() => execCommand(btn.command)}
            className="flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm font-medium text-dash-text hover:bg-dash-border"
          >
            {btn.label === "B" ? (
              <span className="font-bold">{btn.label}</span>
            ) : btn.label === "I" ? (
              <span className="italic">{btn.label}</span>
            ) : btn.label === "U" ? (
              <span className="underline">{btn.label}</span>
            ) : (
              <span className="line-through">{btn.label}</span>
            )}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          title="Heading 1"
          onClick={() => execCommand("formatBlock", "<h1>")}
          className="rounded px-2 py-0.5 text-sm font-medium text-dash-text hover:bg-dash-border"
        >
          H1
        </button>
        <button
          type="button"
          title="Heading 2"
          onClick={() => execCommand("formatBlock", "<h2>")}
          className="rounded px-2 py-0.5 text-sm font-medium text-dash-text hover:bg-dash-border"
        >
          H2
        </button>
        <button
          type="button"
          title="Heading 3"
          onClick={() => execCommand("formatBlock", "<h3>")}
          className="rounded px-2 py-0.5 text-sm font-medium text-dash-text hover:bg-dash-border"
        >
          H3
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          title="Bullet list"
          onClick={() => execCommand("insertUnorderedList")}
          className="rounded px-2 py-0.5 text-sm text-dash-text hover:bg-dash-border"
        >
          • List
        </button>
        <button
          type="button"
          title="Numbered list"
          onClick={() => execCommand("insertOrderedList")}
          className="rounded px-2 py-0.5 text-sm text-dash-text hover:bg-dash-border"
        >
          1. List
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          title="Link"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) execCommand("createLink", url);
          }}
          className="rounded px-2 py-0.5 text-sm text-dash-text hover:bg-dash-border"
        >
          Link
        </button>
        <button
          type="button"
          title="Align left"
          onClick={() => execCommand("justifyLeft")}
          className="rounded px-2 py-0.5 text-sm text-dash-text hover:bg-dash-border"
        >
          ⬅
        </button>
        <button
          type="button"
          title="Align center"
          onClick={() => execCommand("justifyCenter")}
          className="rounded px-2 py-0.5 text-sm text-dash-text hover:bg-dash-border"
        >
          ⬌
        </button>
        <button
          type="button"
          title="Align right"
          onClick={() => execCommand("justifyRight")}
          className="rounded px-2 py-0.5 text-sm text-dash-text hover:bg-dash-border"
        >
          ➡
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-content min-h-[120px] resize-y p-3 outline-none empty:before:text-dash-muted empty:before:content-[attr(data-placeholder)]"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
}
