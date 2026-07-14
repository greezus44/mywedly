import { useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";
import { RICH_FONT_OPTIONS } from "../../lib/theme";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: "Small", value: "small" },
  { label: "Normal", value: "medium" },
  { label: "Large", value: "large" },
  { label: "X-Large", value: "x-large" },
];

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-xs transition-colors",
        active
          ? "bg-dash-primary text-white"
          : "text-dash-text hover:bg-dash-surface-alt",
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []); // only init once

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emit();
  }

  function emit() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }

  function handleInput() {
    emit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      exec("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  }

  return (
    <div className="w-full rounded-md border border-dash-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-dash-border bg-dash-surface-alt px-2 py-1.5">
        {/* Bold */}
        <ToolbarBtn onClick={() => exec("bold")} title="Bold">
          <strong>B</strong>
        </ToolbarBtn>
        {/* Italic */}
        <ToolbarBtn onClick={() => exec("italic")} title="Italic">
          <em>I</em>
        </ToolbarBtn>
        {/* Underline */}
        <ToolbarBtn onClick={() => exec("underline")} title="Underline">
          <span className="underline">U</span>
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Font size */}
        <select
          className="h-7 rounded border border-dash-border bg-dash-surface px-1 text-xs text-dash-text focus:outline-none focus:ring-1 focus:ring-dash-primary/50"
          defaultValue=""
          title="Font size"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) {
              exec("fontSize", "7"); // hack: set to 7 then replace
              // Use inline style instead for proper sizing
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const span = document.createElement("span");
                span.style.fontSize = e.target.value;
                range.surroundContents(span);
                emit();
              }
            }
            e.target.value = "";
          }}
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Font family */}
        <select
          className="h-7 rounded border border-dash-border bg-dash-surface px-1 text-xs text-dash-text focus:outline-none focus:ring-1 focus:ring-dash-primary/50 max-w-[120px]"
          defaultValue=""
          title="Font family"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) {
              exec("fontName", e.target.value);
            }
            e.target.value = "";
          }}
        >
          <option value="" disabled>Font</option>
          {RICH_FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>
          ))}
        </select>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Text colour */}
        <label title="Text color" className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-dash-surface-alt">
          <span className="text-xs font-bold" style={{ textDecoration: "underline 2px solid currentColor" }}>A</span>
          <input
            type="color"
            className="sr-only"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => exec("foreColor", e.target.value)}
          />
        </label>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Alignment */}
        <ToolbarBtn onClick={() => exec("justifyLeft")} title="Align left">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M3 6h18M3 12h12M3 18h15" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("justifyCenter")} title="Center">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M3 6h18M6 12h12M4 18h16" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("justifyRight")} title="Align right">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M3 6h18M9 12h12M6 18h15" />
          </svg>
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Lists */}
        <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered list">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M10 6h11M10 12h11M10 18h11M4 6h.01M4 12h.01M4 18h.01" />
          </svg>
        </ToolbarBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-[120px] p-3 text-sm text-dash-text focus:outline-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-dash-muted empty:before:pointer-events-none",
        )}
        data-placeholder={placeholder ?? "Write something…"}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      />
    </div>
  );
}
