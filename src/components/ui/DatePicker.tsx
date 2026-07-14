import React, { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value?: string | null;
  onChange?: (isoDate: string | null) => void;
  placeholder?: string;
  className?: string;
  minDate?: string | null;
  maxDate?: string | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function parseISO(iso: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10) - 1,
    day: parseInt(match[3], 10),
  };
}

function isSameDay(a: { year: number; month: number; day: number }, b: { year: number; month: number; day: number }): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Select date", className, minDate, maxDate }, ref) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = parseISO(value);
    const today = new Date();
    const [viewYear, setViewYear] = useState(selected?.year ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected?.month ?? today.getMonth());

    useEffect(() => {
      if (selected) {
        setViewYear(selected.year);
        setViewMonth(selected.month);
      }
    }, [value]);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [open]);

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const minParsed = parseISO(minDate);
    const maxParsed = parseISO(maxDate);

    function isDisabled(day: number): boolean {
      const dateObj = { year: viewYear, month: viewMonth, day };
      if (minParsed && new Date(viewYear, viewMonth, day) < new Date(minParsed.year, minParsed.month, minParsed.day)) {
        return true;
      }
      if (maxParsed && new Date(viewYear, viewMonth, day) > new Date(maxParsed.year, maxParsed.month, maxParsed.day)) {
        return true;
      }
      return false;
    }

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

    function handleSelect(day: number) {
      if (isDisabled(day)) return;
      onChange?.(toISODate(viewYear, viewMonth, day));
      setOpen(false);
    }

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const displayValue = selected
      ? `${MONTH_NAMES[selected.month]} ${selected.day}, ${selected.year}`
      : "";

    return (
      <div ref={containerRef} className="relative">
        <input
          ref={ref}
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-dash-primary cursor-pointer",
            className,
          )}
        />
        {open && (
          <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-3 w-72">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded hover:bg-dash-bg text-dash-muted"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-medium text-dash-text">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded hover:bg-dash-bg text-dash-muted"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-dash-muted py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={idx} />;
                const isSelected = selected && isSameDay(selected, { year: viewYear, month: viewMonth, day });
                const disabled = isDisabled(day);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(day)}
                    className={cn(
                      "h-8 w-8 rounded text-sm transition-colors",
                      isSelected && "bg-dash-primary text-dash-primary-fg",
                      !isSelected && !disabled && "text-dash-text hover:bg-dash-bg",
                      disabled && "text-dash-muted opacity-40 cursor-not-allowed",
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
  },
);
DatePicker.displayName = "DatePicker";
