import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (isoDate: string | null) => void;
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

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDateDisplay(iso: string | null): string {
  if (!iso) return "";
  const date = parseISODate(iso);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select a date",
  className,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseISODate(value);
    return d ?? new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const d = parseISODate(value);
      setViewMonth(d ?? new Date());
    }
  }, [open, value]);

  const handleSelect = useCallback(
    (day: Date) => {
      onChange(toISODate(day));
      setOpen(false);
    },
    [onChange]
  );

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selectedDate = parseISODate(value);
  const minDate = parseISODate(min);
  const maxDate = parseISODate(max);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
        )}
      >
        {value ? formatDateDisplay(value) : <span className="text-dash-muted">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-3 w-72">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="px-2 py-1 rounded hover:bg-dash-bg text-dash-text">
              ‹
            </button>
            <span className="text-sm font-medium text-dash-text">
              {MONTH_NAMES[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} className="px-2 py-1 rounded hover:bg-dash-bg text-dash-text">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs text-dash-muted font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
              const isDisabled =
                Boolean((minDate && date < minDate) || (maxDate && date > maxDate));
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelect(date)}
                  className={cn(
                    "text-sm rounded h-8 w-8 flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-text hover:bg-dash-bg",
                    isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {date.getDate()}
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
              className="mt-2 text-xs text-dash-muted hover:text-dash-text w-full text-center"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
