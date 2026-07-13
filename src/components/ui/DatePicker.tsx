import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface DatePickerProps {
  value: string | null; // ISO date "YYYY-MM-DD"
  onChange: (iso: string | null) => void;
  className?: string;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DatePicker({
  value,
  onChange,
  className,
  label,
  placeholder = "Select date",
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => (value ? fromISO(value) : null), [value]);
  const [viewDate, setViewDate] = useState<Date>(() => selected ?? new Date());

  useEffect(() => {
    if (selected) setViewDate(selected);
  }, [selected]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const minDate = min ? fromISO(min) : null;
  const maxDate = max ? fromISO(max) : null;

  const isDisabled = (d: number): boolean => {
    const date = new Date(year, month, d);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const displayValue = value
    ? `${MONTH_NAMES[selected!.getMonth()]} ${selected!.getDate()}, ${selected!.getFullYear()}`
    : "";

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <span className="block text-sm font-medium text-dash-text mb-1">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text",
          "focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary",
        )}
      >
        <span className={cn(!value && "text-dash-muted")}>{displayValue || placeholder}</span>
        <span className="text-dash-muted">📅</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-dash-border bg-dash-surface p-3 shadow-lg animate-slideUp">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-dash-text">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((dn) => (
              <div key={dn} className="text-center text-xs font-medium text-dash-muted py-1">
                {dn}
              </div>
            ))}
            {cells.map((d, i) => (
              <div key={i}>
                {d && (
                  <button
                    type="button"
                    disabled={isDisabled(d)}
                    onClick={() => {
                      onChange(toISO(new Date(year, month, d)));
                      setOpen(false);
                    }}
                    className={cn(
                      "h-8 w-8 rounded-lg text-sm transition-colors",
                      selected && selected.getDate() === d && selected.getMonth() === month && selected.getFullYear() === year
                        ? "bg-dash-primary text-dash-primary-fg font-semibold"
                        : "text-dash-text hover:bg-dash-bg",
                      isDisabled(d) && "opacity-30 cursor-not-allowed hover:bg-transparent",
                    )}
                  >
                    {d}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
