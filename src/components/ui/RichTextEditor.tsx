import { useRef, useEffect, type KeyboardEvent } from "react";
import { RICH_FONT_OPTIONS } from "../../lib/theme";
import { FontSelect } from "./FontSelect";
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
  const editorRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || "";
      initialized.current = true;
    }
  }, [value]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleKey = (e: KeyboardEvent) => {
    // Handle Enter in lists naturally; intercept Ctrl+B/I/U natively via execCommand
    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "i" || e.key === "u")) {
      e.preventDefault();
      const cmd = e.key === "b" ? "bold" : e.key === "i" ? "italic" : "underline";
      exec(cmd);
    }
  };

  const toolBtn = "flex h-8 w-8 items-center justify-center rounded text-sm text-dash-text hover:bg-dash-bg border border-transparent";
  const activeBtn = "bg-dash-primary/10 text-dash-primary";

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        <button type="button" className={toolBtn} title="Bold" onClick={() => exec("bold")}><b>B</b></button>
        <button type="button" className={toolBtn} title="Italic" onClick={() => exec("italic")}><i>I</i></button>
        <button type="button" className={toolBtn} title="Underline" onClick={() => exec("underline")}><u>U</u></button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        <select
          className="rounded border border-dash-border bg-dash-surface px-1.5 py-1 text-xs text-dash-text"
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue="3"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="w-36">
          <FontSelect
            value=""
            onChange={(v) => exec("fontName", v)}
            options={RICH_FONT_OPTIONS}
            placeholder="Font"
          />
        </div>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        <input
          type="color"
          className="h-8 w-8 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5"
          title="Text color"
          onChange={(e) => exec("foreColor", e.target.value)}
        />

        <button type="button" className={toolBtn} title="Link" onClick={() => {
          const url = prompt("Enter URL:");
          if (url) exec("createLink", url);
        }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-2.829 2.829a4 4 0 11-5.656-5.656l1.414 1.414a2 2 0 102.828 2.828l2.829-2.828a2 2 0 000-2.828z" /></svg>
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        <button type="button" className={toolBtn} title="Bullet list" onClick={() => exec("insertUnorderedList")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <button type="button" className={toolBtn} title="Numbered list" onClick={() => exec("insertOrderedList")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        <button type="button" className={toolBtn} title="Align left" onClick={() => exec("justifyLeft")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
        </button>
        <button type="button" className={toolBtn} title="Align center" onClick={() => exec("justifyCenter")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
        </button>
        <button type="button" className={toolBtn} title="Align right" onClick={() => exec("justifyRight")}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKey}
        data-placeholder={placeholder}
        className="rich-content min-h-[120px] p-3 text-sm text-dash-text focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-dash-muted/50"
      />
    </div>
  );
}
