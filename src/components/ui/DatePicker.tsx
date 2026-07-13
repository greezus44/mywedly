import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDate } from "../../lib/utils";

export interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateInput(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePicker({ value, onChange, label, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => toDateInput(value), [value]);
  const min = useMemo(() => toDateInput(minDate), [minDate]);

  const [viewYear, setViewYear] = useState(() => {
    const d = selected || new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selected || new Date();
    return d.getMonth();
  });

  // Sync view when selected changes
  useEffect(() => {
    const d = selected || new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selected]);

  // Close on outside click
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

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const today = new Date();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const prevYear = () => setViewYear((y) => y - 1);
  const nextYear = () => setViewYear((y) => y + 1);

  const handleSelect = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleToday = () => {
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, "0");
    const dd = today.getDate().toString().padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const isDisabled = (day: number): boolean => {
    if (!min) return false;
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const minCopy = new Date(min);
    minCopy.setHours(0, 0, 0, 0);
    return d < minCopy;
  };

  const displayValue = value ? formatDate(value) : "";

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 transition-colors",
          "hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400",
          !displayValue && "text-gray-400"
        )}
      >
        {displayValue || "Select date…"}
      </button>

      {open && (
        <div className="absolute z-50 mt-9 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg animate-fade-in">
          {/* Header: month/year navigation */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevYear}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Previous year"
              >
                <ChevronLeft className="h-3 w-3" />
                <ChevronLeft className="-ml-3.5 h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={prevMonth}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                title="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={nextMonth}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                title="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextYear}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Next year"
              >
                <ChevronRight className="h-3 w-3" />
                <ChevronRight className="-ml-3.5 h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="py-1 text-[10px] font-medium uppercase text-gray-400"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {cells.map((day, idx) => {
              if (day === null) return <div key={idx} />;

              const dayDate = new Date(viewYear, viewMonth, day);
              const isSelected = selected && isSameDay(selected, dayDate);
              const isToday = isSameDay(today, dayDate);
              const disabled = isDisabled(day);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-8 w-8 rounded text-xs transition-colors",
                    disabled && "cursor-not-allowed text-gray-300",
                    !disabled && !isSelected && "text-gray-700 hover:bg-gray-100",
                    isToday && !isSelected && "ring-1 ring-gray-400",
                    isSelected && "bg-gray-900 text-white hover:bg-gray-700"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer buttons */}
          <div className="mt-3 flex justify-between gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
