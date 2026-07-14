import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  command: string;
  label: string;
  onClick: () => void;
}

function ToolbarButton({ command, label, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      data-command={command}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="rounded px-2 py-1 text-sm text-dash-text hover:bg-dash-bg transition-colors"
      title={label}
    >
      {label}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  className,
}: RichTextEditorProps): React.ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        <ToolbarButton command="bold" label="B" onClick={() => exec("bold")} />
        <ToolbarButton command="italic" label="I" onClick={() => exec("italic")} />
        <ToolbarButton command="underline" label="U" onClick={() => exec("underline")} />
        <ToolbarButton command="strikeThrough" label="S" onClick={() => exec("strikeThrough")} />
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <ToolbarButton command="formatBlock" label="H1" onClick={() => exec("formatBlock", "H1")} />
        <ToolbarButton command="formatBlock" label="H2" onClick={() => exec("formatBlock", "H2")} />
        <ToolbarButton command="formatBlock" label="H3" onClick={() => exec("formatBlock", "H3")} />
        <ToolbarButton command="formatBlock" label="P" onClick={() => exec("formatBlock", "P")} />
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <ToolbarButton command="insertUnorderedList" label="• List" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton command="insertOrderedList" label="1. List" onClick={() => exec("insertOrderedList")} />
        <ToolbarButton command="formatBlock" label="❝" onClick={() => exec("formatBlock", "BLOCKQUOTE")} />
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <ToolbarButton
          command="createLink"
          label="Link"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
        />
        <ToolbarButton
          command="insertImage"
          label="Image"
          onClick={() => {
            const url = window.prompt("Enter image URL:");
            if (url) exec("insertImage", url);
          }}
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        data-placeholder={placeholder}
        className={cn(
          "rich-content min-h-[120px] px-4 py-3 outline-none text-sm text-dash-text",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted/60",
        )}
      />
    </div>
  );
}
