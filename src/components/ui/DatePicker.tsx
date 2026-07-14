import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value?: string | null;
  onChange: (isoDate: string | null) => void;
  label?: string;
  className?: string;
  min?: string;
  max?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, label, className, min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  const isDisabled = (d: Date): boolean => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleSelect = (day: number) => {
    const d = new Date(year, month, day);
    if (isDisabled(d)) return;
    onChange(toIsoDate(d));
    setOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const displayValue = selected
    ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text shadow-sm transition-colors hover:border-dash-primary/50 focus:outline-none focus:ring-2 focus:ring-dash-primary/20"
      >
        {displayValue || "Select date…"}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded px-2 py-1 text-sm hover:bg-dash-bg">‹</button>
            <span className="text-sm font-medium text-dash-text">{MONTHS[month]} {year}</span>
            <button type="button" onClick={nextMonth} className="rounded px-2 py-1 text-sm hover:bg-dash-bg">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-xs font-medium text-dash-muted">{wd}</div>
            ))}
            {days.map((day, i) => {
              if (day === null) return <div key={i} />;
              const d = new Date(year, month, day);
              const isSelected = selected && d.getTime() === selected.getTime();
              const disabled = isDisabled(d);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "rounded text-sm transition-colors",
                    disabled
                      ? "cursor-not-allowed text-dash-muted/40"
                      : "text-dash-text hover:bg-dash-primary/10",
                    isSelected && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover",
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
