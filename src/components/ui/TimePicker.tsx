import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn, formatTime12, roundTo5Min, to24Hour } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (time24: string) => void;
  label?: string;
  className?: string;
}

function generateHours(): number[] {
  return Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
}

function generateMinutes(): number[] {
  return Array.from({ length: 12 }, (_, i) => i * 5);
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { hour, minute, period } = useMemo(() => {
    if (!value) return { hour: 12, minute: 0, period: "PM" as "AM" | "PM" };
    const [hStr, mStr] = value.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const p = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return { hour: hour12, minute: Math.round(m / 5) * 5 % 60, period: p };
  }, [value]);

  const [tempHour, setTempHour] = useState(hour);
  const [tempMinute, setTempMinute] = useState(minute);
  const [tempPeriod, setTempPeriod] = useState(period);

  useEffect(() => {
    setTempHour(hour);
    setTempMinute(minute);
    setTempPeriod(period);
  }, [hour, minute, period, open]);

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

  const handleConfirm = useCallback(() => {
    let h = tempHour;
    if (tempPeriod === "PM" && h !== 12) h += 12;
    if (tempPeriod === "AM" && h === 12) h = 0;
    const time24 = `${String(h).padStart(2, "0")}:${String(tempMinute).padStart(2, "0")}`;
    onChange(roundTo5Min(time24));
    setOpen(false);
  }, [tempHour, tempMinute, tempPeriod, onChange]);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
      >
        {value ? formatTime12(value) : <span className="text-dash-muted/60">Select time</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg animate-scaleIn">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex flex-col items-center">
              <span className="text-xs text-dash-muted mb-1">Hour</span>
              <select
                value={tempHour}
                onChange={(e) => setTempHour(Number(e.target.value))}
                className="rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text focus:outline-none"
              >
                {generateHours().map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <span className="mt-5 text-lg font-bold text-dash-text">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xs text-dash-muted mb-1">Min</span>
              <select
                value={tempMinute}
                onChange={(e) => setTempMinute(Number(e.target.value))}
                className="rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text focus:outline-none"
              >
                {generateMinutes().map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-dash-muted mb-1">Period</span>
              <div className="flex rounded-md border border-dash-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTempPeriod("AM")}
                  className={cn(
                    "px-2 py-1 text-xs font-medium transition-colors",
                    tempPeriod === "AM" ? "bg-dash-primary text-dash-primary-fg" : "bg-dash-surface text-dash-text hover:bg-dash-bg",
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setTempPeriod("PM")}
                  className={cn(
                    "px-2 py-1 text-xs font-medium transition-colors",
                    tempPeriod === "PM" ? "bg-dash-primary text-dash-primary-fg" : "bg-dash-surface text-dash-text hover:bg-dash-bg",
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full rounded-md bg-dash-primary px-3 py-1.5 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
