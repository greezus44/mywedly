import React, { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "../../lib/utils";

export interface TimePickerProps {
  value: string; // 24-hour format HH:MM
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  id?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function to24(h12: number, period: "AM" | "PM"): number {
  if (period === "AM" && h12 === 12) return 0;
  if (period === "PM" && h12 !== 12) return h12 + 12;
  return h12;
}

function to12(h24: number): number {
  if (h24 === 0) return 12;
  if (h24 > 12) return h24 - 12;
  return h24;
}

function getPeriod(h24: number): "AM" | "PM" {
  return h24 >= 12 ? "PM" : "AM";
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

export function TimePicker({
  value,
  onChange,
  label,
  className,
  id,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { h24, m } = useMemo(() => {
    if (!value) return { h24: 9, m: 0 };
    const [hs, ms] = value.split(":");
    return { h24: parseInt(hs, 10) || 9, m: parseInt(ms, 10) || 0 };
  }, [value]);

  const hour12 = to12(h24);
  const minuteRounded = Math.round(m / 5) * 5 % 60;
  const period = getPeriod(h24);

  const display = value
    ? `${pad(to12(h24) === 0 ? 12 : to12(h24)).padStart(2, "0")}:${pad(minuteRounded)} ${period}`
    : "";

  function setHour(h12: number) {
    const h = to24(h12, period);
    onChange(`${pad(h)}:${pad(minuteRounded)}`);
  }
  function setMinute(min: number) {
    onChange(`${pad(h24)}:${pad(min)}`);
  }
  function setPeriod(p: "AM" | "PM") {
    const h = to24(hour12 === 0 ? 12 : hour12, p);
    onChange(`${pad(h)}:${pad(minuteRounded)}`);
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text cursor-pointer transition-colors hover:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
        >
          <span className={cn(!display && "text-dash-muted/60")}>
            {display || "Select a time"}
          </span>
          <svg className="h-4 w-4 text-dash-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0V10c0 .2.08.39.22.53l3 3a.75.75 0 101.06-1.06L10.75 9.69V5z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 flex gap-2 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            {/* Hours */}
            <div className="flex flex-col">
              <span className="mb-1 text-center text-xs font-semibold text-dash-muted">Hour</span>
              <div className="max-h-40 overflow-auto scrollbar-thin">
                {HOURS_12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      "block w-10 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                      h === hour12 ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text"
                    )}
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
            </div>
            {/* Minutes */}
            <div className="flex flex-col">
              <span className="mb-1 text-center text-xs font-semibold text-dash-muted">Min</span>
              <div className="max-h-40 overflow-auto scrollbar-thin">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={cn(
                      "block w-10 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                      m === minuteRounded ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text"
                    )}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
            {/* AM/PM */}
            <div className="flex flex-col">
              <span className="mb-1 text-center text-xs font-semibold text-dash-muted">AM/PM</span>
              <button
                type="button"
                onClick={() => setPeriod("AM")}
                className={cn(
                  "mb-1 w-12 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                  period === "AM" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod("PM")}
                className={cn(
                  "w-12 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                  period === "PM" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text"
                )}
              >
                PM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
