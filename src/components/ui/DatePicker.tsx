import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "../../lib/utils";

export interface DatePickerProps {
  value: string | null;
  onChange: (isoDate: string | null) => void;
  label?: string;
  className?: string;
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, label, className, min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = toDate(value) ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = toDate(value);
  const minDate = min ? toDate(min) : null;
  const maxDate = max ? toDate(max) : null;

  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewMonth]);

  const isDisabled = (d: Date | null): boolean => {
    if (!d) return true;
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1", className)}>
      {label && <span className="text-sm font-medium text-dash-text">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text hover:border-dash-primary/50"
      >
        {value ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select date"}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">‹</button>
            <span className="text-sm font-semibold text-dash-text">
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">›</button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-dash-muted">
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const isSelected = selected && toIso(d) === toIso(selected);
              const disabled = isDisabled(d);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(toIso(d));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 rounded text-dash-text hover:bg-dash-primary/10",
                    isSelected && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary",
                    disabled && "cursor-not-allowed text-dash-muted opacity-40 hover:bg-transparent"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-2 w-full text-xs text-dash-muted hover:text-dash-text"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
