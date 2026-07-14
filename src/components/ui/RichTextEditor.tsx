import React, { useRef, useCallback, useEffect } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  className?: string;
  placeholder?: string;
}

const TOOLBAR_GROUPS: { label: string; cmd: string; arg?: string }[] = [
  { label: "B", cmd: "bold" },
  { label: "I", cmd: "italic" },
  { label: "U", cmd: "underline" },
  { label: "S", cmd: "strikeThrough" },
  { label: "H1", cmd: "formatBlock", arg: "h1" },
  { label: "H2", cmd: "formatBlock", arg: "h2" },
  { label: "H3", cmd: "formatBlock", arg: "h3" },
  { label: "P", cmd: "formatBlock", arg: "p" },
  { label: "“ ”", cmd: "formatBlock", arg: "blockquote" },
  { label: "• List", cmd: "insertUnorderedList" },
  { label: "1. List", cmd: "insertOrderedList" },
];

export function RichTextEditor({
  value = "",
  onChange,
  className,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = useCallback((cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange?.(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange?.(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      exec("createLink", url);
    }
  }, [exec]);

  const handleImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      exec("insertImage", url);
    }
  }, [exec]);

  return (
    <div className={cn("rounded-lg border border-dash-border overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        {TOOLBAR_GROUPS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(tool.cmd, tool.arg)}
            className="px-2 py-1 text-xs font-medium rounded hover:bg-dash-surface text-dash-text border border-transparent hover:border-dash-border transition-colors"
          >
            {tool.label}
          </button>
        ))}
        <div className="w-px h-5 bg-dash-border mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
          className="px-2 py-1 text-xs font-medium rounded hover:bg-dash-surface text-dash-text border border-transparent hover:border-dash-border transition-colors"
        >
          Link
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleImage}
          className="px-2 py-1 text-xs font-medium rounded hover:bg-dash-surface text-dash-text border border-transparent hover:border-dash-border transition-colors"
        >
          Image
        </button>
        <div className="w-px h-5 bg-dash-border mx-1" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("removeFormat")}
          className="px-2 py-1 text-xs font-medium rounded hover:bg-dash-surface text-dash-text border border-transparent hover:border-dash-border transition-colors"
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-content min-h-[150px] p-3 outline-none text-sm text-dash-text focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted"
        suppressContentEditableWarning
      />
    </div>
  );
}
