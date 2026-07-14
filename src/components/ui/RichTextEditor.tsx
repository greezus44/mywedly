import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { RICH_FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "7" },
];

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    updateActive();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const updateActive = () => {
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
    updateActive();
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      exec("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  const btn = (onClick: () => void, label: string, isActive = false) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg", isActive && "bg-dash-primary/10 text-dash-primary")}
    >
      {label}
    </button>
  );

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        {btn(() => exec("bold"), "B", active.bold)}
        {btn(() => exec("italic"), "I", active.italic)}
        {btn(() => exec("underline"), "U", active.underline)}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => exec("fontSize", e.target.value)}
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          defaultValue="3"
        >
          {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => exec("fontName", e.target.value)}
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          defaultValue=""
        >
          <option value="">Font</option>
          {RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.stack} style={{ fontFamily: f.stack }}>{f.label}</option>)}
        </select>
        <label className="flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-sm hover:bg-dash-bg">
          <span className="text-dash-muted">A</span>
          <input
            type="color"
            onMouseDown={(e) => e.preventDefault()}
            onChange={(e) => exec("foreColor", e.target.value)}
            className="h-5 w-5 cursor-pointer border-0 p-0"
          />
        </label>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        {btn(() => { const url = prompt("Enter URL:"); if (url) exec("createLink", url); }, "Link")}
        {btn(() => exec("insertUnorderedList"), "• List", active.insertUnorderedList)}
        {btn(() => exec("insertOrderedList"), "1. List", active.insertOrderedList)}
        <div className="mx-1 h-5 w-px bg-dash-border" />
        {btn(() => exec("justifyLeft"), "L")}
        {btn(() => exec("justifyCenter"), "C")}
        {btn(() => exec("justifyRight"), "R")}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateActive}
        onMouseUp={updateActive}
        onKeyDown={handleKey}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="rich-editor min-h-[150px] p-3 text-sm text-dash-text focus:outline-none [&[data-placeholder]:empty]:before:content-[attr(data-placeholder)] [&[data-placeholder]:empty]:before:text-dash-muted/50"
      />
    </div>
  );
}
