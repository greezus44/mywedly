import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
  className?: string;
  label?: string;
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function DatePicker({ value, onChange, className, label, min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = parseISODate(value);
  const [viewDate, setViewDate] = useState<Date>(() => selected ?? new Date());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewDate]);

  const minDate = parseISODate(min ?? null);
  const maxDate = parseISODate(max ?? null);

  function isDisabled(d: Date): boolean {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  function isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function prevMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }

  function handleSelect(d: Date) {
    if (isDisabled(d)) return;
    onChange(toISODate(d));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text hover:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
      >
        <span>{value ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Select date"}</span>
        <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-dash-text">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="flex h-8 items-center justify-center text-xs font-medium text-dash-muted">
                {d}
              </div>
            ))}
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const disabled = isDisabled(d);
              const isSelected = selected && isSameDay(d, selected);
              const isToday = isSameDay(d, new Date());
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(d)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded text-sm transition-colors",
                    disabled && "cursor-not-allowed text-dash-muted opacity-40",
                    !disabled && !isSelected && "text-dash-text hover:bg-dash-bg",
                    isToday && !isSelected && "ring-1 ring-dash-primary",
                    isSelected && "bg-dash-primary text-dash-primary-fg"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
