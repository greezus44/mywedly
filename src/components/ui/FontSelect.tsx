import { useEffect, useRef, useState } from "react";
import type { FontOption } from "../../lib/theme";
import { cn } from "../../lib/utils";

interface FontSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FontOption[];
  placeholder?: string;
  className?: string;
}

/**
 * Custom font-preview dropdown. Each option is rendered in its own font family
 * via `option.stack`, giving a live preview of the typeface.
 */
export function FontSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select a font…",
  className,
}: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text transition-colors",
            "hover:border-dash-primary focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
          )}
        >
          <span
            className="truncate"
            style={selected ? { fontFamily: selected.stack } : undefined}
          >
            {selected ? selected.label : <span className="text-dash-muted">{placeholder}</span>}
          </span>
          <svg
            className={cn("h-4 w-4 shrink-0 text-dash-muted transition-transform", open && "rotate-180")}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-dash-border bg-dash-surface shadow-lg scrollbar-thin">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-dash-bg",
                  opt.value === value ? "bg-dash-bg font-medium text-dash-primary" : "text-dash-text"
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
