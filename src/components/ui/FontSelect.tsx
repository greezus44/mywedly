import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import type { FontOption } from "../../lib/theme";
import { cn } from "../../lib/utils";

interface FontSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FontOption[];
  placeholder?: string;
}

export function FontSelect({ label, value, onChange, options, placeholder = "Select a font" }: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="w-full" ref={ref} onKeyDown={handleKeyDown}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
      >
        <span className="truncate" style={selected ? { fontFamily: selected.stack } : undefined}>
          {selected ? selected.label : <span className="text-dash-muted">{placeholder}</span>}
        </span>
        <svg className={cn("h-4 w-4 shrink-0 text-dash-muted transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-dash-border bg-dash-surface shadow-lg scrollbar-thin">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-dash-bg",
                value === opt.value ? "text-dash-primary" : "text-dash-text"
              )}
              style={{ fontFamily: opt.stack }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
