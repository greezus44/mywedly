import { useEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  className,
  editable = true,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content only once / when value changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, val?: string) => {
    if (!editable) return;
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Allow Tab to insert spaces instead of leaving the editor
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "\t");
    }
  };

  const toolBtn =
    "rounded p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text disabled:opacity-40";
  const sep = "mx-1 h-5 w-px bg-dash-border";

  return (
    <div className={cn("flex flex-col rounded-lg border border-dash-border bg-dash-surface", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-dash-border px-2 py-1">
        <button type="button" className={toolBtn} title="Bold" onClick={() => exec("bold")} onMouseDown={(e) => e.preventDefault()}>
          <span className="font-bold">B</span>
        </button>
        <button type="button" className={toolBtn} title="Italic" onClick={() => exec("italic")} onMouseDown={(e) => e.preventDefault()}>
          <span className="italic">I</span>
        </button>
        <button type="button" className={toolBtn} title="Underline" onClick={() => exec("underline")} onMouseDown={(e) => e.preventDefault()}>
          <span className="underline">U</span>
        </button>
        <button type="button" className={toolBtn} title="Strikethrough" onClick={() => exec("strikeThrough")} onMouseDown={(e) => e.preventDefault()}>
          <span className="line-through">S</span>
        </button>
        <div className={sep} />
        <button type="button" className={toolBtn} title="Bullet list" onClick={() => exec("insertUnorderedList")} onMouseDown={(e) => e.preventDefault()}>
          •≡
        </button>
        <button type="button" className={toolBtn} title="Numbered list" onClick={() => exec("insertOrderedList")} onMouseDown={(e) => e.preventDefault()}>
          1≡
        </button>
        <div className={sep} />
        <button type="button" className={toolBtn} title="Align left" onClick={() => exec("justifyLeft")} onMouseDown={(e) => e.preventDefault()}>
          ⯇
        </button>
        <button type="button" className={toolBtn} title="Align center" onClick={() => exec("justifyCenter")} onMouseDown={(e) => e.preventDefault()}>
          ≡
        </button>
        <button type="button" className={toolBtn} title="Align right" onClick={() => exec("justifyRight")} onMouseDown={(e) => e.preventDefault()}>
          ⯈
        </button>
        <div className={sep} />
        <select
          className="rounded border border-dash-border bg-dash-surface px-1 py-0.5 text-xs text-dash-text"
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue="3"
          title="Font size"
        >
          <option value="1">XS</option>
          <option value="2">S</option>
          <option value="3">M</option>
          <option value="4">L</option>
          <option value="5">XL</option>
          <option value="6">XXL</option>
        </select>
        <input
          type="color"
          className="h-6 w-6 cursor-pointer rounded border border-dash-border"
          onChange={(e) => exec("foreColor", e.target.value)}
          title="Text color"
        />
        <div className={sep} />
        <button
          type="button"
          className={toolBtn}
          title="Insert link"
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) exec("createLink", url);
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          🔗
        </button>
        <button
          type="button"
          className={toolBtn}
          title="Insert image"
          onClick={() => {
            const url = window.prompt("Enter image URL:");
            if (url) exec("insertImage", url);
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          🖼
        </button>
        <div className={sep} />
        <button
          type="button"
          className={toolBtn}
          title="Clear formatting"
          onClick={() => exec("removeFormat")}
          onMouseDown={(e) => e.preventDefault()}
        >
          ✕
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="rich-content min-h-[120px] flex-1 px-3 py-2 text-sm text-dash-text focus:outline-none empty:before:text-dash-muted empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
