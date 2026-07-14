import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (time: string) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function parseTime(time: string): { hour: number; minute: number; period: "AM" | "PM" } | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: parseInt(match[1], 10),
      minute: parseInt(match[2], 10),
      period: match[3].toUpperCase() as "AM" | "PM",
    };
  }
  const h24 = time.match(/^(\d{2}):(\d{2})$/);
  if (h24) {
    const twelve = to12Hour(`${h24[1]}:${h24[2]}`);
    const m = twelve.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
      return {
        hour: parseInt(m[1], 10),
        minute: parseInt(m[2], 10),
        period: m[3].toUpperCase() as "AM" | "PM",
      };
    }
  }
  return null;
}

export function TimePicker({
  value,
  onChange,
  className,
  label,
  placeholder = "Select a time",
}: TimePickerProps) {
  const parsed = value ? parseTime(value) : null;
  const [hour, setHour] = useState<number>(parsed?.hour ?? 12);
  const [minute, setMinute] = useState<number>(parsed?.minute ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed?.period ?? "AM");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const p = parseTime(value);
      if (p) {
        setHour(p.hour);
        setMinute(p.minute);
        setPeriod(p.period);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const emit = useCallback(
    (h: number, m: number, p: "AM" | "PM") => {
      const time12 = `${h}:${String(m).padStart(2, "0")} ${p}`;
      const time24 = to24Hour(time12);
      onChange(roundTo5Min(time24));
    },
    [onChange]
  );

  const handleHour = (h: number) => {
    setHour(h);
    emit(h, minute, period);
  };
  const handleMinute = (m: number) => {
    setMinute(m);
    emit(hour, m, period);
  };
  const handlePeriod = (p: "AM" | "PM") => {
    setPeriod(p);
    emit(hour, minute, p);
  };

  const displayValue = value ? to12Hour(value) : "";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text",
          "hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary"
        )}
      >
        <span className={cn(!displayValue && "text-dash-muted")}>
          {displayValue || placeholder}
        </span>
        <svg
          className="h-4 w-4 text-dash-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-xs font-medium text-dash-muted">Hour</span>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {HOURS_12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHour(h)}
                    className={cn(
                      "flex h-8 w-10 items-center justify-center rounded text-sm transition-colors",
                      h === hour
                        ? "bg-dash-primary text-dash-primary-fg font-semibold"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-1 text-xs font-medium text-dash-muted">Min</span>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinute(m)}
                    className={cn(
                      "flex h-8 w-10 items-center justify-center rounded text-sm transition-colors",
                      m === minute
                        ? "bg-dash-primary text-dash-primary-fg font-semibold"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-1 text-xs font-medium text-dash-muted">AM/PM</span>
              <div>
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriod(p)}
                    className={cn(
                      "flex h-8 w-10 items-center justify-center rounded text-sm transition-colors",
                      p === period
                        ? "bg-dash-primary text-dash-primary-fg font-semibold"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
