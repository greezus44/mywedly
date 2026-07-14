import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { to24Hour, to12Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  label?: string;
  className?: string;
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
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

  const normalized = value ? roundTo5Min(to24Hour(value)) : "09:00";
  const [hStr, mStr] = normalized.split(":");
  const hour24 = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const setHour = (h12: number, p: "AM" | "PM") => {
    let h = h12;
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    onChange(`${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
  };

  const setMinute = (m: number) => {
    onChange(`${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const setPeriod = (p: "AM" | "PM") => {
    setHour(hour12, p);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className={cn("w-full relative", className)} ref={containerRef}>
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
        <span className="text-dash-text">{value ? to12Hour(value) : "Select time"}</span>
        <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-3 flex gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-dash-muted font-medium text-center mb-1">Hour</span>
            <div className="max-h-40 overflow-y-auto scrollbar-thin">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHour(h, period)}
                  className={cn(
                    "w-full px-3 py-1 text-sm rounded transition-colors",
                    h === hour12
                      ? "bg-dash-primary text-dash-primary-fg font-semibold"
                      : "text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-dash-muted font-medium text-center mb-1">Min</span>
            <div className="max-h-40 overflow-y-auto scrollbar-thin">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinute(m)}
                  className={cn(
                    "w-full px-3 py-1 text-sm rounded transition-colors",
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
          <div className="flex flex-col">
            <span className="text-xs text-dash-muted font-medium text-center mb-1">AM/PM</span>
            <div>
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "w-full px-3 py-1 text-sm rounded transition-colors",
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
      )}
    </div>
  );
}
