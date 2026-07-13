import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link as LinkIcon, Quote, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from "lucide-react";

interface RichTextEditorProps {
  value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = "Start typing...", minHeight = 200 }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) { ref.current.innerHTML = value || ""; } }, [value]);

  const exec = (cmd: string, val?: string) => {
    (document.execCommand as any)("styleWithCSS", false);
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const tools = [
    { icon: Bold, cmd: "bold", label: "Bold" }, { icon: Italic, cmd: "italic", label: "Italic" },
    { icon: Underline, cmd: "underline", label: "Underline" }, { icon: Strikethrough, cmd: "strikeThrough", label: "Strikethrough" },
    { icon: List, cmd: "insertUnorderedList", label: "Bullet List" }, { icon: ListOrdered, cmd: "insertOrderedList", label: "Numbered List" },
    { icon: Quote, cmd: "formatBlock", val: "blockquote", label: "Quote" },
    { icon: AlignLeft, cmd: "justifyLeft", label: "Align Left" }, { icon: AlignCenter, cmd: "justifyCenter", label: "Align Center" }, { icon: AlignRight, cmd: "justifyRight", label: "Align Right" },
    { icon: Undo, cmd: "undo", label: "Undo" }, { icon: Redo, cmd: "redo", label: "Redo" },
  ];

  return (
    <div className="border border-dash-border rounded-lg overflow-hidden">
      <div className="rte-toolbar flex flex-wrap gap-1 p-2 border-b border-dash-border bg-slate-50">
        {tools.map((t, i) => (
          <button key={i} type="button" title={t.label} onClick={() => exec(t.cmd, t.val)} className="p-1.5 rounded hover:bg-slate-200 text-dash-text"><t.icon className="w-4 h-4" /></button>
        ))}
        <button type="button" title="Link" onClick={() => { const url = prompt("Enter URL:"); if (url) exec("createLink", url); }} className="p-1.5 rounded hover:bg-slate-200 text-dash-text"><LinkIcon className="w-4 h-4" /></button>
      </div>
      <div ref={ref} contentEditable data-placeholder={placeholder} onInput={() => ref.current && onChange(ref.current.innerHTML)} className="rte-content px-4 py-3 focus:outline-none text-dash-text" style={{ minHeight }} />
    </div>
  );
}
