import { useState, useRef, useEffect, type ChangeEvent } from "react";
import type { FontOption } from "../../lib/theme";
import { cn } from "../../lib/utils";

interface FontSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FontOption[];
  placeholder?: string;
}

export function FontSelect({ label, value, onChange, options, placeholder }: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
        >
          <span style={{ fontFamily: value || undefined }} className={cn(!selected && !value && "text-dash-muted/60")}>
            {selected ? selected.label : value || placeholder || "Select font"}
          </span>
          <svg className={cn("h-4 w-4 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-dash-border bg-dash-surface shadow-lg scrollbar-thin">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{ fontFamily: opt.stack }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-dash-bg",
                  opt.value === value ? "bg-dash-primary/10 text-dash-primary" : "text-dash-text",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
