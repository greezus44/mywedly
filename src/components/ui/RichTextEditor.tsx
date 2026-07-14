import React, { useRef, useCallback, useEffect } from "react";
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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    execCommand("insertText", text);
  }, []);

  const toolbarButtons: { label: string; action: () => void; title: string }[] = [
    { label: "B", title: "Bold", action: () => execCommand("bold") },
    { label: "I", title: "Italic", action: () => execCommand("italic") },
    { label: "U", title: "Underline", action: () => execCommand("underline") },
    { label: "H1", title: "Heading 1", action: () => execCommand("formatBlock", "<h1>") },
    { label: "H2", title: "Heading 2", action: () => execCommand("formatBlock", "<h2>") },
    { label: "H3", title: "Heading 3", action: () => execCommand("formatBlock", "<h3>") },
    { label: "P", title: "Paragraph", action: () => execCommand("formatBlock", "<p>") },
    { label: "•", title: "Bullet List", action: () => execCommand("insertUnorderedList") },
    { label: "1.", title: "Numbered List", action: () => execCommand("insertOrderedList") },
    { label: "❝", title: "Quote", action: () => execCommand("formatBlock", "<blockquote>") },
    { label: "Link", title: "Insert Link", action: () => {
      const url = prompt("Enter URL:");
      if (url) execCommand("createLink", url);
    }},
    { label: "⟲", title: "Undo", action: () => execCommand("undo") },
    { label: "⟳", title: "Redo", action: () => execCommand("redo") },
  ];

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        {toolbarButtons.map((btn, i) => (
          <button
            key={i}
            type="button"
            title={btn.title}
            onClick={btn.action}
            className="min-w-[28px] h-7 px-1.5 rounded text-sm font-medium text-dash-text hover:bg-dash-surface hover:text-dash-primary transition-colors"
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[120px] px-4 py-3 text-sm text-dash-text focus:outline-none",
          "[&[data-placeholder]]:empty:before:content-[attr(data-placeholder)] [&[data-placeholder]]:empty:before:text-dash-muted"
        )}
      />
    </div>
  );
}
