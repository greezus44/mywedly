import { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, Undo, Redo, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { RICH_FONT_OPTIONS, FONT_SIZE_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";
interface RichTextEditorProps { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number; }
export function RichTextEditor({ value, onChange, placeholder = "Start typing...", minHeight = 120 }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [currentFont, setCurrentFont] = useState("Inter");
  const [currentSize, setCurrentSize] = useState("16px");
  useEffect(() => { if (editorRef.current && !isInternalChange.current) { const current = editorRef.current.innerHTML; if (current !== value) { editorRef.current.innerHTML = value || ""; } } isInternalChange.current = false; }, [value]);
  const syncActiveStates = useCallback(() => { if (!editorRef.current) return; try { setActiveStates({ bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline"), strikeThrough: document.queryCommandState("strikeThrough"), insertUnorderedList: document.queryCommandState("insertUnorderedList"), insertOrderedList: document.queryCommandState("insertOrderedList"), justifyLeft: document.queryCommandState("justifyLeft"), justifyCenter: document.queryCommandState("justifyCenter"), justifyRight: document.queryCommandState("justifyRight"), justifyFull: document.queryCommandState("justifyFull") }); const el = window.getSelection()?.anchorNode?.parentElement; if (el) { setCurrentSize(el.style.fontSize || "16px"); const computedFont = el.style.fontFamily?.replace(/['"]/g, "") || "Inter"; setCurrentFont(computedFont.split(",")[0].trim()); } } catch { /* ignore */ } }, []);
  const exec = useCallback((command: string, val?: string) => { editorRef.current?.focus(); try { document.execCommand("styleWithCSS", false, "true"); } catch { /* ignore */ } document.execCommand(command, false, val); syncActiveStates(); if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); } }, [onChange, syncActiveStates]);
  const handleInput = useCallback(() => { if (editorRef.current) { isInternalChange.current = true; onChange(editorRef.current.innerHTML); } syncActiveStates(); }, [onChange, syncActiveStates]);
  const handleLink = useCallback(() => { const selection = window.getSelection(); if (!selection || selection.isCollapsed) { const url = window.prompt("Enter URL:"); if (url) exec("createLink", url); return; } const url = window.prompt("Enter URL (leave empty to remove link):"); if (!url) { exec("unlink"); } else { exec("createLink", url.startsWith("http") ? url : `https://${url}`); } }, [exec]);
  const handleClearFormatting = useCallback(() => { exec("removeFormat"); exec("unlink"); }, [exec]);
  const btn = (onClick: () => void, icon: React.ReactNode, label: string, active?: boolean) => <button type="button" onClick={onClick} title={label} className={cn(active && "active")}>{icon}</button>;
  return (
    <div>
      <div className="rte-toolbar" onMouseDown={(e) => e.preventDefault()}>
        <select value={currentFont} onChange={(e) => { exec("fontName", e.target.value); setCurrentFont(e.target.value); }} title="Font Family">{RICH_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select>
        <select value={currentSize} onChange={(e) => { exec("fontSize", e.target.value); setCurrentSize(e.target.value); }} title="Font Size">{FONT_SIZE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <span className="rte-divider" />
        {btn(() => exec("bold"), <Bold className="w-3.5 h-3.5" />, "Bold", activeStates.bold)}
        {btn(() => exec("italic"), <Italic className="w-3.5 h-3.5" />, "Italic", activeStates.italic)}
        {btn(() => exec("underline"), <Underline className="w-3.5 h-3.5" />, "Underline", activeStates.underline)}
        {btn(() => exec("strikeThrough"), <Strikethrough className="w-3.5 h-3.5" />, "Strikethrough", activeStates.strikeThrough)}
        <span className="rte-divider" />
        <label title="Text Colour" className="relative inline-flex items-center cursor-pointer" style={{ padding: 0, minWidth: 28, height: 28 }}><span className="inline-flex items-center justify-center w-full h-full"><span className="text-xs font-medium" style={{ fontSize: "11px" }}>A</span></span><input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => exec("foreColor", e.target.value)} /></label>
        <label title="Highlight Colour" className="relative inline-flex items-center cursor-pointer" style={{ padding: 0, minWidth: 28, height: 28 }}><span className="inline-flex items-center justify-center w-full h-full"><span className="text-xs" style={{ fontSize: "11px", backgroundColor: "#fffde7", padding: "0 2px" }}>H</span></span><input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => exec("hiliteColor", e.target.value)} /></label>
        <span className="rte-divider" />
        {btn(() => exec("justifyLeft"), <AlignLeft className="w-3.5 h-3.5" />, "Align Left", activeStates.justifyLeft)}
        {btn(() => exec("justifyCenter"), <AlignCenter className="w-3.5 h-3.5" />, "Align Center", activeStates.justifyCenter)}
        {btn(() => exec("justifyRight"), <AlignRight className="w-3.5 h-3.5" />, "Align Right", activeStates.justifyRight)}
        {btn(() => exec("justifyFull"), <AlignJustify className="w-3.5 h-3.5" />, "Justify", activeStates.justifyFull)}
        <span className="rte-divider" />
        {btn(() => exec("insertUnorderedList"), <List className="w-3.5 h-3.5" />, "Bullet List", activeStates.insertUnorderedList)}
        {btn(() => exec("insertOrderedList"), <ListOrdered className="w-3.5 h-3.5" />, "Numbered List", activeStates.insertOrderedList)}
        <span className="rte-divider" />
        {btn(handleLink, <Link2 className="w-3.5 h-3.5" />, "Add/Edit Link")}
        <span className="rte-divider" />
        {btn(() => exec("undo"), <Undo className="w-3.5 h-3.5" />, "Undo")}
        {btn(() => exec("redo"), <Redo className="w-3.5 h-3.5" />, "Redo")}
        {btn(handleClearFormatting, <Eraser className="w-3.5 h-3.5" />, "Clear Formatting")}
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyUp={syncActiveStates} onMouseUp={syncActiveStates} data-placeholder={placeholder} className="rte-editor" style={{ minHeight }} />
    </div>
  );
}
