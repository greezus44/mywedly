import React, { useEffect, useRef, useState } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value?: string | null;
  onChange: (time: string | null) => void;
  placeholder?: string;
  className?: string;
}

function buildOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  const start = roundTo5Min(new Date());
  start.setHours(0, 0, 0, 0);
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      options.push({ label: to12Hour(value), value });
    }
  }
  return options;
}

const OPTIONS = buildOptions();

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = value ? to12Hour(value) : null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
      >
        {display ?? <span className="text-dash-muted/60">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-dash-border bg-dash-surface p-1 shadow-lg scrollbar-thin">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full rounded px-3 py-1.5 text-left text-sm transition-colors",
                value === opt.value
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "text-dash-text hover:bg-dash-bg"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
