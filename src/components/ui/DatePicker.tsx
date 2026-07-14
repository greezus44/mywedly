import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value?: string | null;
  onChange: (isoDate: string | null) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateParts(iso: string | null | undefined): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return null;
  return { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
}

function toIsoDate(y: number, m: number, d: number): string {
  return new Date(y, m, d).toISOString().split("T")[0];
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const p = toDateParts(value);
    return p ? p.y : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const p = toDateParts(value);
    return p ? p.m : new Date().getMonth();
  });
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

  const selected = toDateParts(value);
  const minParts = toDateParts(minDate);
  const maxParts = toDateParts(maxDate);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDisabled = (d: number) => {
    const iso = toIsoDate(viewYear, viewMonth, d);
    if (minParts && iso < toIsoDate(minParts.y, minParts.m, minParts.d)) return true;
    if (maxParts && iso > toIsoDate(maxParts.y, maxParts.m, maxParts.d)) return true;
    return false;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
      >
        {value ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : (
          <span className="text-dash-muted/60">{placeholder}</span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="px-2 py-1 text-dash-muted hover:text-dash-text">
              ‹
            </button>
            <span className="text-sm font-medium text-dash-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="px-2 py-1 text-dash-muted hover:text-dash-text">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((dn) => (
              <div key={dn} className="text-center text-xs font-medium text-dash-muted">
                {dn}
              </div>
            ))}
            {cells.map((d, i) => (
              <div key={i}>
                {d !== null && (
                  <button
                    type="button"
                    disabled={isDisabled(d)}
                    onClick={() => {
                      onChange(toIsoDate(viewYear, viewMonth, d));
                      setOpen(false);
                    }}
                    className={cn(
                      "h-8 w-8 rounded text-sm transition-colors",
                      selected && selected.y === viewYear && selected.m === viewMonth && selected.d === d
                        ? "bg-dash-primary text-dash-primary-fg"
                        : "text-dash-text hover:bg-dash-bg",
                      isDisabled(d) && "opacity-40 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {d}
                  </button>
                )}
              </div>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-2 w-full text-center text-xs text-dash-muted hover:text-dash-text"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
