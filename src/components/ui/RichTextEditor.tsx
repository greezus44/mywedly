import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { sanitizeHtml } from "../../lib/sanitize";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

type Cmd = "bold" | "italic" | "underline" | "strikeThrough" | "h1" | "h2" | "h3" | "insertUnorderedList" | "insertOrderedList" | "formatBlock" | "createLink" | "insertImage";

function exec(cmd: Cmd, value?: string) {
  document.execCommand(cmd, false, value);
}

export function RichTextEditor({ value, onChange, placeholder = "Write something...", className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Set<string>>(new Set());
  const lastValue = useRef<string>(value);

  useEffect(() => {
    if (ref.current && value !== lastValue.current) {
      ref.current.innerHTML = value;
      lastValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = value;
      lastValue.current = value;
    }
  }, []);

  const updateActive = useCallback(() => {
    const s = new Set<string>();
    if (document.queryCommandState("bold")) s.add("bold");
    if (document.queryCommandState("italic")) s.add("italic");
    if (document.queryCommandState("underline")) s.add("underline");
    if (document.queryCommandState("strikeThrough")) s.add("strikeThrough");
    const block = document.queryCommandValue("formatBlock").toLowerCase();
    if (block === "h1") s.add("h1");
    if (block === "h2") s.add("h2");
    if (block === "h3") s.add("h3");
    setActive(s);
  }, []);

  function handleInput() {
    if (ref.current) {
      const html = ref.current.innerHTML;
      lastValue.current = html;
      onChange(html);
    }
  }

  function handleBlur() {
    if (ref.current) {
      const clean = sanitizeHtml(ref.current.innerHTML);
      ref.current.innerHTML = clean;
      lastValue.current = clean;
      onChange(clean);
    }
  }

  function run(cmd: Cmd, value?: string) {
    ref.current?.focus();
    exec(cmd, value);
    handleInput();
    updateActive();
  }

  function handleHeading(tag: string) {
    run("formatBlock", tag);
  }

  function handleLink() {
    const url = window.prompt("Enter URL:");
    if (url) run("createLink", url);
  }

  function handleImage() {
    const url = window.prompt("Enter image URL:");
    if (url) run("insertImage", url);
  }

  const ToolButton = ({ cmd: _cmd, onClick, label, isActive }: { cmd: string; onClick: () => void; label: string; isActive?: boolean }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "rounded px-2 py-1 text-sm font-medium transition-colors",
        isActive ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        <ToolButton cmd="bold" onClick={() => run("bold")} label="B" isActive={active.has("bold")} />
        <ToolButton cmd="italic" onClick={() => run("italic")} label="I" isActive={active.has("italic")} />
        <ToolButton cmd="underline" onClick={() => run("underline")} label="U" isActive={active.has("underline")} />
        <ToolButton cmd="strikeThrough" onClick={() => run("strikeThrough")} label="S" isActive={active.has("strikeThrough")} />
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <ToolButton cmd="h1" onClick={() => handleHeading("h1")} label="H1" isActive={active.has("h1")} />
        <ToolButton cmd="h2" onClick={() => handleHeading("h2")} label="H2" isActive={active.has("h2")} />
        <ToolButton cmd="h3" onClick={() => handleHeading("h3")} label="H3" isActive={active.has("h3")} />
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <ToolButton cmd="ul" onClick={() => run("insertUnorderedList")} label="• List" />
        <ToolButton cmd="ol" onClick={() => run("insertOrderedList")} label="1. List" />
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <ToolButton cmd="link" onClick={handleLink} label="Link" />
        <ToolButton cmd="image" onClick={handleImage} label="Image" />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onMouseUp={updateActive}
        onKeyUp={updateActive}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[120px] max-w-full overflow-y-auto p-3 text-sm text-dash-text focus:outline-none",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted/60",
        )}
      />
    </div>
  );
}
