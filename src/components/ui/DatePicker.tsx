import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string | null; // ISO date string "YYYY-MM-DD"
  onChange: (date: string | null) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value + "T00:00:00");
  return isNaN(date.getTime()) ? null : date;
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
  const [viewMonth, setViewMonth] = useState(() => {
    const parsed = parseDate(value);
    return parsed ?? new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedDate = useMemo(() => parseDate(value), [value]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysCount; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  function isDisabled(date: Date): boolean {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function selectDate(date: Date) {
    if (isDisabled(date)) return;
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function prevMonth() {
    setViewMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewMonth(new Date(year, month + 1, 1));
  }

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 text-sm transition-colors",
            "hover:border-dash-primary focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
          )}
        >
          <span className={displayValue ? "text-dash-text" : "text-dash-muted"}>
            {displayValue || placeholder}
          </span>
          <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-dash-text">
                {MONTHS[month]} {year}
              </span>
              <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-dash-muted">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((date, idx) => {
                if (!date) return <div key={idx} />;
                const isSelected =
                  selectedDate &&
                  date.toDateString() === selectedDate.toDateString();
                const disabled = isDisabled(date);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(date)}
                    className={cn(
                      "h-8 w-8 rounded text-sm transition-colors",
                      disabled
                        ? "cursor-not-allowed text-dash-muted opacity-40"
                        : "text-dash-text hover:bg-dash-bg",
                      isSelected && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Clear button */}
            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="mt-2 w-full rounded-md py-1 text-xs text-dash-muted hover:bg-dash-bg"
              >
                Clear date
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
