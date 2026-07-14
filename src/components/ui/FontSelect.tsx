import { useState, useRef, useEffect, type ChangeEvent } from "react";
import type { FontOption } from "../../lib/theme";
import { cn } from "../../lib/utils";

export interface FontSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FontOption[];
  placeholder?: string;
  className?: string;
}

export function FontSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select a font",
  className,
}: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: FontOption) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text transition-colors hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/30",
            open && "border-dash-primary ring-2 ring-dash-primary/30"
          )}
        >
          <span
            className="truncate"
            style={{ fontFamily: selected?.stack || undefined }}
          >
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className={cn("h-4 w-4 shrink-0 text-dash-muted transition-transform", open && "rotate-180")}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-dash-border bg-dash-surface shadow-lg scrollbar-thin">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-dash-bg",
                  value === option.value && "bg-dash-bg font-medium"
                )}
                style={{ fontFamily: option.stack }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FontSelect;
