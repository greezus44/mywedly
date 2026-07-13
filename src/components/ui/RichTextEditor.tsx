import { useCallback, useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Eraser,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { FONT_SIZE_OPTIONS, RICH_FONT_OPTIONS } from "../../lib/theme";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = 160,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value into the contentEditable when it changes externally.
  useEffect(() => {
    const el = ref.current;
    if (!el || isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (value !== el.innerHTML) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    isInternalChange.current = true;
    onChange(el.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (command: string, val?: string) => {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, val);
      ref.current?.focus();
      emitChange();
    },
    [emitChange],
  );

  const handleBlur = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const handleInput = useCallback(() => {
    emitChange();
  }, [emitChange]);

  const applyFont = (font: string) => exec("fontName", font);
  const applyFontSize = (size: string) => exec("fontSize", size);
  const applyColor = (color: string) => exec("foreColor", color);
  const applyBgColor = (color: string) => exec("hiliteColor", color);

  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const clearFormatting = () => {
    exec("removeFormat");
    exec("delete");
  };

  return (
    <div className="flex flex-col rounded-lg border border-gray-300 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2">
        <select
          onChange={(e) => {
            applyFont(e.target.value);
            e.target.selectedIndex = 0;
          }}
          className="h-8 rounded border border-gray-300 bg-white px-1 text-xs"
          title="Font family"
          defaultValue=""
        >
          <option value="" disabled>
            Font
          </option>
          {RICH_FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => {
            applyFontSize(e.target.value);
            e.target.selectedIndex = 0;
          }}
          className="h-8 rounded border border-gray-300 bg-white px-1 text-xs"
          title="Font size"
          defaultValue=""
        >
          <option value="" disabled>
            Size
          </option>
          {FONT_SIZE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => exec("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("underline")} title="Underline">
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("strikeThrough")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <label className="flex h-8 items-center rounded border border-gray-300 px-1" title="Text color">
          <span className="mr-1 text-xs text-gray-500">A</span>
          <input
            type="color"
            onChange={(e) => applyColor(e.target.value)}
            className="h-5 w-6 cursor-pointer border-0 p-0"
          />
        </label>
        <label className="flex h-8 items-center rounded border border-gray-300 px-1" title="Highlight color">
          <span className="mr-1 text-xs text-gray-500">H</span>
          <input
            type="color"
            onChange={(e) => applyBgColor(e.target.value)}
            className="h-5 w-6 cursor-pointer border-0 p-0"
          />
        </label>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => exec("justifyLeft")} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyCenter")} title="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("justifyRight")} title="Align right">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("insertOrderedList")} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={insertLink} title="Insert link">
          <Link2 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <ToolbarButton onClick={() => exec("undo")} title="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec("redo")} title="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={clearFormatting} title="Clear formatting">
          <Eraser className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        data-placeholder={placeholder}
        className={cn(
          "rich-text-editor w-full px-3 py-2 text-sm text-gray-900 focus:outline-none",
          "empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]",
        )}
        style={{ minHeight }}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {children}
    </button>
  );
}
