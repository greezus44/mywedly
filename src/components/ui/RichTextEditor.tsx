import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Eraser,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { RICH_FONT_OPTIONS, FONT_SIZE_OPTIONS } from "../../lib/theme";

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = 200,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize content on mount.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value when not focused (avoid cursor jumps).
  useEffect(() => {
    if (!isFocused && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isFocused]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      exec("createLink", url);
    }
  }, [exec]);

  const handleClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      onChange("");
    }
  }, [onChange]);

  const toolbarButton = (onClick: () => void, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      title={label}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      {/* Toolbar */}
      <div className="rte-toolbar">
        <select
          title="Font family"
          onChange={(e) => exec("fontName", e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
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
          title="Font size"
          onChange={(e) => exec("fontSize", e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
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

        <span className="rte-divider" />

        {toolbarButton(() => exec("bold"), <Bold className="h-4 w-4" />, "Bold")}
        {toolbarButton(() => exec("italic"), <Italic className="h-4 w-4" />, "Italic")}
        {toolbarButton(() => exec("underline"), <UnderlineIcon className="h-4 w-4" />, "Underline")}
        {toolbarButton(() => exec("strikeThrough"), <Strikethrough className="h-4 w-4" />, "Strikethrough")}

        <span className="rte-divider" />

        {toolbarButton(() => exec("insertUnorderedList"), <List className="h-4 w-4" />, "Bullet list")}
        {toolbarButton(() => exec("insertOrderedList"), <ListOrdered className="h-4 w-4" />, "Numbered list")}

        <span className="rte-divider" />

        {toolbarButton(() => exec("justifyLeft"), <AlignLeft className="h-4 w-4" />, "Align left")}
        {toolbarButton(() => exec("justifyCenter"), <AlignCenter className="h-4 w-4" />, "Align center")}
        {toolbarButton(() => exec("justifyRight"), <AlignRight className="h-4 w-4" />, "Align right")}

        <span className="rte-divider" />

        {toolbarButton(handleLink, <LinkIcon className="h-4 w-4" />, "Insert link")}

        <span className="rte-divider" />

        {toolbarButton(() => exec("undo"), <Undo className="h-4 w-4" />, "Undo")}
        {toolbarButton(() => exec("redo"), <Redo className="h-4 w-4" />, "Redo")}
        {toolbarButton(handleClear, <Eraser className="h-4 w-4" />, "Clear formatting")}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn("rte-editor focus:outline-none")}
        style={{ minHeight }}
      />
    </div>
  );
}
