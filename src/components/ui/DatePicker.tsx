import React, { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { Input } from "./Input";

interface DatePickerProps {
  value: string | null;
  onChange: (isoDate: string | null) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toIsoDate(dateInput: string): string | null {
  if (!dateInput) return null;
  const d = new Date(dateInput + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select a date",
  min,
  max,
}) => {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedDate = value ? new Date(value) : null;

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;

  const isDisabled = (d: Date) => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

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

  const selectDate = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(toIsoDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        label={label}
        readOnly
        value={selectedDate ? selectedDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
        placeholder={placeholder}
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer"
      />
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
              ‹
            </button>
            <span className="text-sm font-medium text-dash-text">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((dn) => (
              <div key={dn} className="px-1 pb-1 text-center text-xs text-dash-muted">
                {dn}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
              const disabled = isDisabled(d);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(d)}
                  className={cn(
                    "h-8 w-8 rounded text-xs transition-colors",
                    isSelected
                      ? "bg-dash-primary text-dash-primary-fg"
                      : disabled
                        ? "text-dash-muted/40 cursor-not-allowed"
                        : "text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
