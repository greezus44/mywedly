import React, { useMemo, useState } from "react";
import { cn } from "../../lib/utils";

export interface DatePickerProps {
  value: string | null;
  onChange: (isoDate: string | null) => void;
  className?: string;
  label?: string;
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
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

export function DatePicker({ value, onChange, className, label }: DatePickerProps) {
  const selected = parseISODate(value);
  const [viewDate, setViewDate] = useState(
    selected ?? new Date()
  );
  const [open, setOpen] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const total = lastDay.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const today = new Date();
  const todayISO = toISODate(today);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const selectDay = (d: Date) => {
    onChange(toISODate(d));
    setOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30",
          !displayValue && "text-dash-muted/60"
        )}
      >
        {displayValue || "Select a date"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 w-72 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            {/* Header */}
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
                {MONTH_NAMES[month]} {year}
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
            {/* Day names */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DAY_NAMES.map((dn) => (
                <div
                  key={dn}
                  className="text-center text-xs font-medium text-dash-muted"
                >
                  {dn}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />;
                const iso = toISODate(d);
                const isSelected = selected && toISODate(selected) === iso;
                const isToday = todayISO === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => selectDay(d)}
                    className={cn(
                      "rounded p-1.5 text-sm transition-colors",
                      isSelected
                        ? "bg-dash-primary text-dash-primary-fg font-medium"
                        : "text-dash-text hover:bg-dash-bg",
                      isToday && !isSelected && "ring-1 ring-dash-primary"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
