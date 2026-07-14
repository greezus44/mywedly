import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "../../lib/utils";

export interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select a date",
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal view state for the calendar
  const initial = useMemo(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    setViewYear(initial.getFullYear());
    setViewMonth(initial.getMonth());
  }, [initial]);

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

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const today = new Date();
  const todayStr = toDateInputValue(today);

  const displayValue = value || "";

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text cursor-pointer transition-colors hover:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
        >
          <span className={cn(!displayValue && "text-dash-muted/60")}>
            {displayValue || placeholder}
          </span>
          <svg className="h-4 w-4 text-dash-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-.75 5.5h10v-.75A1.25 1.25 0 0013.75 5.5H6.25A1.25 1.25 0 005 6.75v.75z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-72 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg" aria-label="Previous month">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
              </button>
              <span className="text-sm font-semibold text-dash-text">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg" aria-label="Next month">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 5.23a.75.75 0 01 1.06.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 11-1.04-1.08L8.832 10 4.894 6.29a.75.75 0 01-.02-1.06z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-dash-muted">{d}</div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
                const isSelected = selectedDate && !isNaN(selectedDate.getTime()) && toDateInputValue(selectedDate) === dateStr;
                const isToday = dateStr === todayStr;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange(dateStr);
                      setOpen(false);
                    }}
                    className={cn(
                      "h-8 w-8 rounded text-sm transition-colors hover:bg-dash-bg",
                      isSelected && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover",
                      !isSelected && isToday && "border border-dash-primary text-dash-primary",
                      !isSelected && !isToday && "text-dash-text"
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
    </div>
  );
}
