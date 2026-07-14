import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

type Command =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "formatBlock|h1"
  | "formatBlock|h2"
  | "formatBlock|h3"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock|blockquote"
  | "createLink"
  | "insertImage"
  | "removeFormat";

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && !focused) {
      ref.current.innerHTML = value || "";
    }
  }, [value, focused]);

  const exec = useCallback((command: Command) => {
    ref.current?.focus();
    if (command === "createLink") {
      const url = window.prompt("Enter URL:");
      if (url) {
        document.execCommand("createLink", false, url);
      }
    } else if (command === "insertImage") {
      const url = window.prompt("Enter image URL:");
      if (url) {
        document.execCommand("insertImage", false, url);
      }
    } else if (command.startsWith("formatBlock|")) {
      const tag = command.split("|")[1];
      document.execCommand("formatBlock", false, tag);
    } else {
      document.execCommand(command);
    }
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  const toolbarButtons: { cmd: Command; label: string; title: string }[] = [
    { cmd: "bold", label: "B", title: "Bold" },
    { cmd: "italic", label: "I", title: "Italic" },
    { cmd: "underline", label: "U", title: "Underline" },
    { cmd: "strikeThrough", label: "S", title: "Strikethrough" },
    { cmd: "formatBlock|h1", label: "H1", title: "Heading 1" },
    { cmd: "formatBlock|h2", label: "H2", title: "Heading 2" },
    { cmd: "formatBlock|h3", label: "H3", title: "Heading 3" },
    { cmd: "insertUnorderedList", label: "• List", title: "Bullet List" },
    { cmd: "insertOrderedList", label: "1. List", title: "Numbered List" },
    { cmd: "formatBlock|blockquote", label: "❝", title: "Quote" },
    { cmd: "createLink", label: "🔗", title: "Insert Link" },
    { cmd: "insertImage", label: "🖼", title: "Insert Image" },
    { cmd: "removeFormat", label: "⌫", title: "Clear Formatting" },
  ];

  return (
    <div className={cn("rounded-md border border-dash-border overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.cmd}
            type="button"
            title={btn.title}
            onClick={() => exec(btn.cmd)}
            className="rounded px-2 py-1 text-sm text-dash-text hover:bg-dash-surface hover:text-dash-primary transition-colors min-w-[28px]"
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
        className="rich-content min-h-[120px] px-3 py-2 text-sm text-dash-text focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted/60"
      />
    </div>
  );
}
