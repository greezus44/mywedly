import React, { useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function exec(command: string, val?: string) {
    document.execCommand("styleWithCSS", false as unknown as boolean);
    document.execCommand(command, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  function handleInput() {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  const tools = [
    { cmd: "bold", icon: "B", label: "Bold" },
    { cmd: "italic", icon: "I", label: "Italic" },
    { cmd: "underline", icon: "U", label: "Underline" },
    { cmd: "strikeThrough", icon: "S", label: "Strikethrough" },
    { cmd: "insertUnorderedList", icon: "•", label: "Bullet list" },
    { cmd: "insertOrderedList", icon: "1.", label: "Numbered list" },
    { cmd: "justifyLeft", icon: "⟸", label: "Align left" },
    { cmd: "justifyCenter", icon: "⟷", label: "Align center" },
    { cmd: "justifyRight", icon: "⟹", label: "Align right" },
  ];

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface overflow-hidden", className)}>
      <div className="flex items-center gap-1 border-b border-dash-border px-2 py-1.5 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.label}
            onClick={() => exec(t.cmd)}
            className="h-8 w-8 rounded hover:bg-dash-bg flex items-center justify-center text-sm font-semibold text-dash-text"
          >
            {t.icon}
          </button>
        ))}
        <div className="w-px h-6 bg-dash-border mx-1" />
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          className="h-8 rounded border border-dash-border bg-dash-surface px-1 text-sm"
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="6">Heading</option>
        </select>
        <input
          type="color"
          onChange={(e) => exec("foreColor", e.target.value)}
          className="h-8 w-8 rounded cursor-pointer"
          title="Text color"
        />
        <button
          type="button"
          title="Insert link"
          onClick={() => {
            const url = prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          className="h-8 px-2 rounded hover:bg-dash-bg text-sm text-dash-text"
        >
          Link
        </button>
        <button
          type="button"
          title="Insert image"
          onClick={() => {
            const url = prompt("Enter image URL:");
            if (url) exec("insertImage", url);
          }}
          className="h-8 px-2 rounded hover:bg-dash-bg text-sm text-dash-text"
        >
          Image
        </button>
        <button
          type="button"
          title="Remove formatting"
          onClick={() => exec("removeFormat")}
          className="h-8 px-2 rounded hover:bg-dash-bg text-sm text-dash-text"
        >
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-content min-h-[120px] p-3 outline-none text-sm [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted/50"
        style={{ lineHeight: 1.7 }}
      />
    </div>
  );
}
