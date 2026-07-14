import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

type Cmd =
  | "bold" | "italic" | "underline" | "strikeThrough"
  | "insertUnorderedList" | "insertOrderedList"
  | "justifyLeft" | "justifyCenter" | "justifyRight"
  | "removeFormat" | "createLink" | "insertImage"
  | "fontSize" | "foreColor";

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "5" },
  { label: "Huge", value: "6" },
];

const COLORS = [
  "#000000", "#374151", "#6b7280", "#9ca3af",
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#10b981", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
];

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value;
    }
  }, [value]);

  const exec = useCallback((cmd: Cmd, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      lastValueRef.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      lastValueRef.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = useCallback(() => {
    if (linkUrl) {
      exec("createLink", linkUrl);
      setLinkUrl("");
      setShowLink(false);
    }
  }, [linkUrl, exec]);

  const insertImage = useCallback(() => {
    if (imageUrl) {
      exec("insertImage", imageUrl);
      setImageUrl("");
      setShowImage(false);
    }
  }, [imageUrl, exec]);

  const clearFormatting = useCallback(() => {
    exec("removeFormat");
    if (editorRef.current) {
      editorRef.current.innerHTML = editorRef.current.textContent || "";
      lastValueRef.current = editorRef.current.innerHTML;
      onChange(editorRef.current.innerHTML);
    }
  }, [exec, onChange]);

  const toolbarBtn = "px-2 py-1 text-sm rounded hover:bg-dash-bg text-dash-text transition-colors";

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-dash-border bg-dash-bg/50 px-2 py-1.5">
        <button type="button" className={cn(toolbarBtn, "font-bold")} onClick={() => exec("bold")} title="Bold">
          B
        </button>
        <button type="button" className={cn(toolbarBtn, "italic")} onClick={() => exec("italic")} title="Italic">
          I
        </button>
        <button type="button" className={cn(toolbarBtn, "underline")} onClick={() => exec("underline")} title="Underline">
          U
        </button>
        <button type="button" className={cn(toolbarBtn, "line-through")} onClick={() => exec("strikeThrough")} title="Strikethrough">
          S
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button type="button" className={toolbarBtn} onClick={() => exec("insertUnorderedList")} title="Bullet list">
          • List
        </button>
        <button type="button" className={toolbarBtn} onClick={() => exec("insertOrderedList")} title="Numbered list">
          1. List
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button type="button" className={toolbarBtn} onClick={() => exec("justifyLeft")} title="Align left">
          Left
        </button>
        <button type="button" className={toolbarBtn} onClick={() => exec("justifyCenter")} title="Align center">
          Center
        </button>
        <button type="button" className={toolbarBtn} onClick={() => exec("justifyRight")} title="Align right">
          Right
        </button>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <select
          className="rounded border border-dash-border bg-dash-surface px-1 py-1 text-xs text-dash-text"
          onChange={(e) => exec("fontSize", e.target.value)}
          defaultValue=""
          title="Font size"
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 rounded border border-dash-border bg-dash-surface px-1 py-1 text-xs" title="Text color">
          <span className="text-dash-muted">A</span>
          <input
            type="color"
            className="h-4 w-5 cursor-pointer rounded border-0 p-0"
            onChange={(e) => exec("foreColor", e.target.value)}
          />
        </label>
        <div className="mx-1 h-5 w-px bg-dash-border" />
        <button type="button" className={toolbarBtn} onClick={() => setShowLink(!showLink)} title="Insert link">
          Link
        </button>
        <button type="button" className={toolbarBtn} onClick={() => setShowImage(!showImage)} title="Insert image">
          Image
        </button>
        <button type="button" className={cn(toolbarBtn, "text-red-600")} onClick={clearFormatting} title="Clear formatting">
          Clear
        </button>
      </div>

      {showLink && (
        <div className="flex items-center gap-2 border-b border-dash-border px-2 py-1.5">
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 rounded border border-dash-border bg-dash-surface px-2 py-1 text-sm"
          />
          <Button size="sm" onClick={insertLink}>Insert</Button>
        </div>
      )}

      {showImage && (
        <div className="flex items-center gap-2 border-b border-dash-border px-2 py-1.5">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="flex-1 rounded border border-dash-border bg-dash-surface px-2 py-1 text-sm"
          />
          <Button size="sm" onClick={insertImage}>Insert</Button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-content min-h-[200px] w-full px-4 py-3 text-sm text-dash-text focus:outline-none [&:empty:before]:text-dash-muted [&:empty:before]:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
