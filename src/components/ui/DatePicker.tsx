import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { cn } from "../../lib/utils";

export interface DatePickerProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value + "T00:00:00");
  return isNaN(date.getTime()) ? null : date;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select a date",
  min,
  max,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const parsed = parseDate(value);
    return parsed ?? new Date();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseDate(value);
    if (parsed) setViewDate(parsed);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = parseDate(value);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  // Next month days
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleSelect = (date: Date) => {
    onChange(toISODate(date));
    setOpen(false);
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isDisabled = (date: Date) => {
    if (min) {
      const minDate = parseDate(min);
      if (minDate && date < minDate) return true;
    }
    if (max) {
      const maxDate = parseDate(max);
      if (maxDate && date > maxDate) return true;
    }
    return false;
  };

  const displayValue = selected
    ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

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
          <span className={cn(!displayValue && "text-dash-muted/60")}>
            {displayValue || placeholder}
          </span>
          <svg className="h-4 w-4 text-dash-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-72 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-md p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-dash-text">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-md p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-dash-muted">
                  {day}
                </div>
              ))}
              {cells.map((cell, idx) => {
                const disabled = isDisabled(cell.date);
                const isSelected = selected && isSameDay(cell.date, selected);
                const isToday = isSameDay(cell.date, new Date());
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(cell.date)}
                    className={cn(
                      "h-8 rounded-md text-xs transition-colors",
                      !cell.isCurrentMonth && "text-dash-muted/40",
                      cell.isCurrentMonth && !isSelected && "text-dash-text hover:bg-dash-bg",
                      isSelected && "bg-dash-primary text-dash-primary-fg",
                      isToday && !isSelected && "ring-1 ring-dash-primary",
                      disabled && "cursor-not-allowed opacity-40"
                    )}
                  >
                    {cell.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DatePicker;
