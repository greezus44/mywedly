import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

export interface DatePickerProps {
  value: string | null;
  onChange: (isoDate: string) => void;
  className?: string;
  label?: string;
  placeholder?: string;
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

function parseISODate(s: string): Date | null {
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return d;
}

export function DatePicker({
  value,
  onChange,
  className,
  label,
  placeholder = "Select a date",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(
    () => (value ? parseISODate(value) : new Date())!
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const d = parseISODate(value);
      if (d) setViewDate(d);
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectedDate = value ? parseISODate(value) : null;

  const daysInMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  ).getDay();

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const selectDay = useCallback(
    (day: number) => {
      const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      onChange(toISODate(d));
      setOpen(false);
    },
    [viewDate, onChange]
  );

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === viewDate.getFullYear() &&
    today.getMonth() === viewDate.getMonth() &&
    today.getDate() === day;
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewDate.getFullYear() &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getDate() === day
    );
  };

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text",
          "hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary"
        )}
      >
        <span className={cn(!displayValue && "text-dash-muted")}>
          {displayValue || placeholder}
        </span>
        <svg
          className="h-4 w-4 text-dash-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-dash-text">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="flex h-8 w-8 items-center justify-center text-xs font-medium text-dash-muted"
              >
                {d[0]}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                    isSelected(day)
                      ? "bg-dash-primary text-dash-primary-fg font-semibold"
                      : isToday(day)
                      ? "bg-dash-primary/10 text-dash-primary font-medium"
                      : "text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
