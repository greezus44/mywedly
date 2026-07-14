import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

interface ToolBarAction {
  cmd?: string;
  arg?: string;
  label?: string;
  title?: string;
  sep?: boolean;
}

const TOOLBAR_ACTIONS: ToolBarAction[] = [
  { cmd: "bold", label: "B", title: "Bold" },
  { cmd: "italic", label: "I", title: "Italic" },
  { cmd: "underline", label: "U", title: "Underline" },
  { cmd: "strikeThrough", label: "S", title: "Strikethrough" },
  { sep: true },
  { cmd: "formatBlock", arg: "H1", label: "H1", title: "Heading 1" },
  { cmd: "formatBlock", arg: "H2", label: "H2", title: "Heading 2" },
  { cmd: "formatBlock", arg: "H3", label: "H3", title: "Heading 3" },
  { cmd: "formatBlock", arg: "P", label: "P", title: "Paragraph" },
  { sep: true },
  { cmd: "insertUnorderedList", label: "• List", title: "Bullet list" },
  { cmd: "insertOrderedList", label: "1. List", title: "Numbered list" },
  { cmd: "formatBlock", arg: "BLOCKQUOTE", label: "❝", title: "Quote" },
  { sep: true },
  { cmd: "createLink", label: "🔗", title: "Insert link", arg: "prompt" },
  { cmd: "insertImage", label: "🖼", title: "Insert image", arg: "prompt" },
];

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef<string>(value);

  useEffect(() => {
    if (ref.current && lastValue.current !== value && document.activeElement !== ref.current) {
      ref.current.innerHTML = value || "";
      lastValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (ref.current && !ref.current.innerHTML && value) {
      ref.current.innerHTML = value;
      lastValue.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback((cmd: string, arg?: string) => {
    let finalArg: string | undefined = arg;
    if (arg === "prompt") {
      if (cmd === "createLink") {
        const url = window.prompt("Enter URL:");
        if (!url) return;
        finalArg = url;
      } else if (cmd === "insertImage") {
        const url = window.prompt("Enter image URL:");
        if (!url) return;
        finalArg = url;
      }
    }
    document.execCommand(cmd, false, finalArg);
    if (ref.current) {
      lastValue.current = ref.current.innerHTML;
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      lastValue.current = ref.current.innerHTML;
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className={cn("flex flex-col rounded-md border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg px-2 py-1.5">
        {TOOLBAR_ACTIONS.map((action, i) =>
          action.sep ? (
            <span key={i} className="mx-1 h-5 w-px bg-dash-border" />
          ) : (
            <button
              key={i}
              type="button"
              title={action.title}
              onClick={() => action.cmd && exec(action.cmd, action.arg)}
              className="min-w-[28px] rounded px-1.5 py-1 text-sm font-medium text-dash-text hover:bg-dash-surface"
            >
              {action.label}
            </button>
          )
        )}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="rich-content min-h-[160px] flex-1 overflow-y-auto scrollbar-thin px-3 py-2 text-sm text-dash-text focus:outline-none"
      />
      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: var(--dash-muted, #64748b);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
