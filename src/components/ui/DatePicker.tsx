import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  min?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(iso: string): Date | null {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  className,
  min,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = value ? parseISODate(value) : null;
    return d ?? new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = value ? parseISODate(value) : null;
  const minDate = min ? parseISODate(min) : null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isDisabled = (date: Date | null) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    return false;
  };

  const displayValue = selected
    ? `${MONTHS[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`
    : "";

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-10 px-3 rounded-md border border-dash-border bg-dash-surface text-sm text-left",
          "flex items-center justify-between transition-colors",
          "focus:outline-none focus:border-dash-primary focus:ring-2 focus:ring-dash-primary"
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
        <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-3 w-72">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-dash-bg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-dash-text">
              {MONTHS[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-dash-bg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-dash-muted font-medium">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              if (!date) return <div key={i} />;
              const isSelected = selected && date.toDateString() === selected.toDateString();
              const disabled = isDisabled(date);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(toISODate(date));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 w-8 rounded text-sm transition-colors",
                    isSelected
                      ? "bg-dash-primary text-dash-primary-fg font-semibold"
                      : disabled
                        ? "text-dash-muted cursor-not-allowed"
                        : "text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
