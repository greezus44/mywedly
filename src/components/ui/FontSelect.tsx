import React, { useState, useRef, useEffect, useMemo } from "react";
import type { FontOption } from "../../lib/theme";
import { cn } from "../../lib/utils";

export interface FontSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: FontOption[];
  placeholder?: string;
  className?: string;
  id?: string;
}

export function FontSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select a font…",
  className,
  id,
}: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the currently selected option to render its label in the button
  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value]
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectId = id || (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Hidden native select for form compatibility */}
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          <option value="">Select a font…</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text cursor-pointer transition-colors hover:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
          )}
        >
          <span
            className="truncate"
            style={selectedOption ? { fontFamily: selectedOption.stack } : undefined}
          >
            {selectedOption ? selectedOption.label : <span className="text-dash-muted/60">{placeholder}</span>}
          </span>
          <svg
            className={cn("h-4 w-4 shrink-0 text-dash-muted transition-transform", open && "rotate-180")}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Dropdown list */}
        {open && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-dash-border bg-dash-surface shadow-lg scrollbar-thin">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm text-dash-text transition-colors hover:bg-dash-bg",
                    isSelected && "bg-dash-bg font-semibold"
                  )}
                  style={{ fontFamily: opt.stack }}
                >
                  <span className="flex-1 text-left truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="h-4 w-4 text-dash-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
