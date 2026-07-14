import { useEffect, useMemo, useRef, useState } from "react";
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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, label, placeholder = "Select date", className, min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => parseDate(value ?? null) ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      if (d) setViewDate(d);
    }
  }, [value]);


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

  const selected = parseDate(value);
  const minDate = min ? parseDate(min) : null;
  const maxDate = max ? parseDate(max) : null;

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewDate]);

  function isDisabled(d: Date): boolean {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  function prevMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }
  function selectDate(d: Date) {
    if (isDisabled(d)) return;
    onChange(toISODate(d));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && <label className="mb-1 block text-sm font-medium text-dash-text">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text",
          "transition-colors hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/40",
        )}
      >
        {selected ? selected.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : <span className="text-dash-muted">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text" aria-label="Previous month">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" /></svg>
            </button>
            <span className="text-sm font-semibold text-dash-text">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text" aria-label="Next month">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-xs font-medium text-dash-muted">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const isSelected = selected && toISODate(d) === toISODate(selected);
              const disabled = isDisabled(d);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(d)}
                  className={cn(
                    "h-8 w-8 rounded text-sm transition-colors",
                    isSelected ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                    disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between border-t border-dash-border pt-2">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }} className="text-xs text-dash-muted hover:text-dash-text">
              Clear
            </button>
            <button type="button" onClick={() => { setViewDate(new Date()); }} className="text-xs text-dash-muted hover:text-dash-text">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
