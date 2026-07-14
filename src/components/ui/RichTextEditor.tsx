import { useEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
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
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      execCommand("bold");
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "i") {
      e.preventDefault();
      execCommand("italic");
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "u") {
      e.preventDefault();
      execCommand("underline");
    }
  };

  const toolbarButtons = [
    { label: "B", command: "bold", className: "font-bold" },
    { label: "I", command: "italic", className: "italic" },
    { label: "U", command: "underline", className: "underline" },
    { label: "S", command: "strikeThrough", className: "line-through" },
  ];

  const blockButtons = [
    { label: "H1", command: "formatBlock", value: "H1" },
    { label: "H2", command: "formatBlock", value: "H2" },
    { label: "H3", command: "formatBlock", value: "H3" },
    { label: "P", command: "formatBlock", value: "P" },
  ];

  const listButtons = [
    { label: "• List", command: "insertUnorderedList" },
    { label: "1. List", command: "insertOrderedList" },
  ];

  const handleLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) execCommand("createLink", url);
  };

  const handleImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) execCommand("insertImage", url);
  };

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(btn.command);
            }}
            className={cn(
              "rounded px-2 py-1 text-sm hover:bg-dash-surface",
              btn.className
            )}
          >
            {btn.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        {blockButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(btn.command, btn.value);
            }}
            className="rounded px-2 py-1 text-xs font-medium hover:bg-dash-surface"
          >
            {btn.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        {listButtons.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(btn.command);
            }}
            className="rounded px-2 py-1 text-xs hover:bg-dash-surface"
          >
            {btn.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleLink();
          }}
          className="rounded px-2 py-1 text-xs hover:bg-dash-surface"
        >
          Link
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleImage();
          }}
          className="rounded px-2 py-1 text-xs hover:bg-dash-surface"
        >
          Image
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand("formatBlock", "BLOCKQUOTE");
          }}
          className="rounded px-2 py-1 text-xs hover:bg-dash-surface"
        >
          Quote
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[120px] px-4 py-3 outline-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-dash-muted"
        )}
        suppressContentEditableWarning
      />
    </div>
  );
}
