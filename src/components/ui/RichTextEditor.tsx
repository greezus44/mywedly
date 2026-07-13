import React, { useCallback, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
  Eraser,
  Palette,
} from "lucide-react";
import { FONT_OPTIONS, RICH_FONT_OPTIONS, FONT_SIZE_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  minHeight = 120,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value into the editor when it differs from current content
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      // ignore
    }
    try {
      document.execCommand(command, false, val);
    } catch {
      // ignore
    }
    editorRef.current?.focus();
    syncContent();
  }, []);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = () => {
    syncContent();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow basic keyboard shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      exec("bold");
    } else if ((e.metaKey || e.ctrlKey) && e.key === "i") {
      e.preventDefault();
      exec("italic");
    } else if ((e.metaKey || e.ctrlKey) && e.key === "u") {
      e.preventDefault();
      exec("underline");
    }
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      exec("createLink", url);
    }
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    if (font) exec("fontName", font);
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    if (size) exec("fontSize", "7"); // set to largest then override via span
    // execCommand fontSize only supports 1-7, so we use a workaround
    try {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = size;
        try {
          range.surroundContents(span);
        } catch {
          // fallback: extract and wrap
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }
      }
    } catch {
      // ignore
    }
    syncContent();
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    exec("foreColor", e.target.value);
  };

  const handleClear = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      syncContent();
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
      <div className="rte-toolbar">
        <select onChange={handleFontChange} defaultValue="" title="Font family">
          <option value="" disabled>
            Font
          </option>
          {RICH_FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select onChange={handleSizeChange} defaultValue="" title="Font size">
          <option value="" disabled>
            Size
          </option>
          {FONT_SIZE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="rte-divider" />

        <ToolbarButton onClick={() => exec("bold")} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} title="Underline">
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("strikeThrough")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="rte-divider" />

        <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("insertOrderedList")} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="rte-divider" />

        <ToolbarButton onClick={() => exec("justifyLeft")} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyCenter")} title="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyRight")} title="Align right">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="rte-divider" />

        <label
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors hover:bg-gray-200"
          title="Text color"
        >
          <Palette className="h-4 w-4" />
          <input
            type="color"
            onChange={handleColorChange}
            className="sr-only"
            defaultValue="#000000"
          />
        </label>

        <ToolbarButton onClick={handleLink} title="Insert link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="rte-divider" />

        <ToolbarButton onClick={() => exec("undo")} title="Undo">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("redo")} title="Redo">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleClear} title="Clear formatting">
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={syncContent}
        data-placeholder={placeholder}
        className="rte-editor"
        style={{ minHeight }}
      />
    </div>
  );
}
