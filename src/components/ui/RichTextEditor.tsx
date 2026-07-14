import React, { useRef, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, []);

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    handleInput();
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 mb-2 border-b pb-2">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} className="px-2 py-1 text-sm rounded hover:bg-gray-100 font-bold">B</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} className="px-2 py-1 text-sm rounded hover:bg-gray-100 italic">I</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }} className="px-2 py-1 text-sm rounded hover:bg-gray-100 underline">U</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("strikeThrough"); }} className="px-2 py-1 text-sm rounded hover:bg-gray-100 line-through">S</button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Left</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Center</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Right</button>
        <span className="w-px bg-gray-300 mx-1" />
        <input type="color" onChange={(e) => exec("foreColor", e.target.value)} className="w-7 h-7 rounded cursor-pointer" title="Text colour" />
        <input type="color" onChange={(e) => exec("fontName", e.target.value)} className="hidden" />
        <select onChange={(e) => exec("fontName", e.target.value)} className="px-1 py-1 text-sm border rounded" defaultValue="">
          <option value="" disabled>Font</option>
          <option value="Inter, sans-serif">Inter</option>
          <option value="'Playfair Display', serif">Playfair</option>
          <option value="'Lora', serif">Lora</option>
          <option value="'Cormorant Garamond', serif">Cormorant</option>
        </select>
        <select onChange={(e) => exec("fontSize", e.target.value)} className="px-1 py-1 text-sm border rounded" defaultValue="3">
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--event-primary,#8B7355)] prose prose-sm max-w-none"
        style={{ ["--tw-prose" as string]: "inherit" } as React.CSSProperties}
      />
    </div>
  );
}
