import { useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";
import { RICH_FONT_OPTIONS } from "../../lib/theme";
import { FontSelect } from "./FontSelect";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Heading", value: "6" },
];

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Set initial content
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

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Prevent default browser shortcuts from causing navigation
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      handleCreateLink();
    }
  };

  const handleCreateLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      exec("createLink", url);
      // Add target and rel to created links
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const link = selection.anchorNode.parentElement?.closest("a");
        if (link) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        }
      }
    }
  };

  const handleFontFamily = (fontStack: string) => {
    exec("fontName", fontStack);
  };

  const handleColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    exec("foreColor", e.target.value);
  };

  const toolbarBtn = "rounded p-1.5 text-dash-text hover:bg-dash-bg transition-colors";
  const toolbarBtnActive = "bg-dash-bg text-dash-primary";

  return (
    <div className={cn("w-full rounded-lg border border-dash-border bg-dash-surface", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border p-2">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
          className={cn(toolbarBtn, "font-bold")}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}
          className={cn(toolbarBtn, "italic")}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}
          className={cn(toolbarBtn, "underline")}
          title="Underline"
        >
          U
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Font size */}
        <select
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue="3"
          className="rounded border border-dash-border bg-dash-surface px-2 py-1 text-xs text-dash-text"
          title="Font size"
        >
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Font family */}
        <div className="w-40">
          <FontSelect
            value=""
            onChange={handleFontFamily}
            options={RICH_FONT_OPTIONS}
            placeholder="Font"
          />
        </div>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        {/* Text color */}
        <label className={cn(toolbarBtn, "cursor-pointer")} title="Text color">
          <span className="flex items-center gap-1">
            <span>A</span>
            <span className="h-3 w-3 rounded border border-dash-border" style={{ backgroundColor: "#000000" }} />
          </span>
          <input
            type="color"
            onChange={handleColor}
            className="hidden"
          />
        </label>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); handleCreateLink(); }}
          className={toolbarBtn}
          title="Insert link"
        >
          🔗
        </button>

        <div className="mx-1 h-5 w-px bg-dash-border" />

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}
          className={toolbarBtn}
          title="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }}
          className={toolbarBtn}
          title="Numbered list"
        >
          1.
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="rich-content min-h-[200px] p-4 outline-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-dash-muted/50"
        suppressContentEditableWarning
      />
    </div>
  );
}

export default RichTextEditor;
