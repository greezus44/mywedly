import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string | null; // ISO date YYYY-MM-DD
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

export function DatePicker({ value, onChange, label, placeholder = "Select date", className, min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) return parseISODate(value);
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setViewDate(parseISODate(value));
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  const isDisabled = (d: Date): boolean => {
    if (min && toISODate(d) < min) return true;
    if (max && toISODate(d) > max) return true;
    return false;
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevYear = () => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
  const nextYear = () => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));

  return (
    <div className={cn("flex flex-col gap-1", className)} ref={containerRef}>
      {label && <label className="text-sm font-medium text-dash-text">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text hover:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
        >
          {value || <span className="text-dash-muted">{placeholder}</span>}
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button type="button" onClick={prevYear} className="rounded p-1 text-dash-muted hover:bg-dash-bg" title="Previous year">«</button>
                <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg" title="Previous month">‹</button>
              </div>
              <span className="text-sm font-semibold text-dash-text">
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg" title="Next month">›</button>
                <button type="button" onClick={nextYear} className="rounded p-1 text-dash-muted hover:bg-dash-bg" title="Next year">»</button>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-dash-muted">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                if (!d) return <div key={i} />;
                const iso = toISODate(d);
                const selected = value === iso;
                const disabled = isDisabled(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded p-1 text-center text-sm transition-colors",
                      selected
                        ? "bg-dash-primary text-dash-primary-fg"
                        : "text-dash-text hover:bg-dash-bg",
                      disabled && "cursor-not-allowed opacity-30 hover:bg-transparent"
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
                className="mt-2 w-full rounded p-1 text-xs text-dash-muted hover:bg-dash-bg"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
