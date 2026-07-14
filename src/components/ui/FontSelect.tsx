import { useState, useRef, useEffect } from "react";
import type { FontOption } from "../../lib/theme";
import { cn } from "../../lib/utils";

interface FontSelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: FontOption[];
  placeholder?: string;
}

export function FontSelect({ label, value, onChange, options, placeholder = "Select font…" }: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-left",
            "flex items-center justify-between gap-2",
            "focus:outline-none focus:ring-2 focus:ring-dash-primary/50 focus:border-dash-primary",
            "transition-colors hover:border-dash-primary/50",
          )}
        >
          <span
            style={{ fontFamily: selected?.stack }}
            className="truncate text-dash-text"
          >
            {selected ? selected.label : <span className="text-dash-muted">{placeholder}</span>}
          </span>
          <svg
            className={cn("h-4 w-4 text-dash-muted shrink-0 transition-transform", open && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-dash-border bg-dash-surface shadow-lg overflow-hidden">
            <ul className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left hover:bg-dash-surface-alt transition-colors",
                      value === opt.value && "bg-dash-surface-alt font-medium text-dash-primary",
                    )}
                    style={{ fontFamily: opt.stack }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
