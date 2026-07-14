import { useEffect, useRef, useState } from "react";
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
  const selected = options.find((o) => o.value === value || o.stack === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="w-full">
      {label && <label className="mb-1 block text-xs font-medium text-dash-muted">{label}</label>}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
        >
          <span style={{ fontFamily: selected?.stack }} className={cn(!selected && "text-dash-muted")}>
            {selected ? selected.label : placeholder || "Select font"}
          </span>
          <svg className={cn("h-4 w-4 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-dash-border bg-dash-surface shadow-lg scrollbar-thin">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-dash-bg",
                  value === opt.value && "bg-dash-primary/10 text-dash-primary",
                )}
                style={{ fontFamily: opt.stack }}
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
