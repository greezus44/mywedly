import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  label?: string;
  className?: string;
}

function formatDisplay(time24: string | null): string {
  if (!time24) return "";
  return to12Hour(time24);
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Internal state for hour, minute, period
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

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

  useEffect(() => {
    if (open && value) {
      const [h, m] = value.split(":").map(Number);
      const p = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      setHour(String(displayH));
      setMinute(String(m).padStart(2, "0"));
      setPeriod(p);
    } else if (open && !value) {
      setHour("12");
      setMinute("00");
      setPeriod("AM");
    }
  }, [open, value]);

  const commit = useCallback(
    (h: string, m: string, p: "AM" | "PM") => {
      const time12 = `${h}:${m} ${p}`;
      const time24 = to24Hour(time12);
      const rounded = roundTo5Min(time24);
      onChange(rounded);
    },
    [onChange]
  );

  const handleHourChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(1, Math.min(12, num));
    const h = String(clamped);
    setHour(h);
    commit(h, minute, period);
  };

  const handleMinuteChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(59, num));
    const m = String(clamped).padStart(2, "0");
    setMinute(m);
    commit(hour, m, period);
  };

  const togglePeriod = () => {
    const p = period === "AM" ? "PM" : "AM";
    setPeriod(p);
    commit(hour, minute, p);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
      >
        {value ? formatDisplay(value) : <span className="text-dash-muted">Select time</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-4 w-64">
          <div className="flex items-center justify-center gap-2 mb-4">
            <select
              value={hour}
              onChange={(e) => handleHourChange(e.target.value)}
              className="rounded-md border border-dash-border bg-dash-surface px-2 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-dash-text font-medium">:</span>
            <select
              value={minute}
              onChange={(e) => handleMinuteChange(e.target.value)}
              className="rounded-md border border-dash-border bg-dash-surface px-2 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            >
              {minutes.map((m) => (
                <option key={m} value={String(m).padStart(2, "0")}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={togglePeriod}
              className="rounded-md border border-dash-border bg-dash-surface px-3 py-1.5 text-sm font-medium text-dash-text hover:bg-dash-bg focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
            >
              {period}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHour(String(h));
                  commit(String(h), minute, period);
                }}
                className={cn(
                  "text-sm rounded h-8 transition-colors",
                  hour === String(h)
                    ? "bg-dash-primary text-dash-primary-fg"
                    : "text-dash-text hover:bg-dash-bg"
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1 mb-3">
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  const mStr = String(m).padStart(2, "0");
                  setMinute(mStr);
                  commit(hour, mStr, period);
                }}
                className={cn(
                  "text-xs rounded h-7 transition-colors",
                  minute === String(m).padStart(2, "0")
                    ? "bg-dash-primary text-dash-primary-fg"
                    : "text-dash-text hover:bg-dash-bg"
                )}
              >
                {String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="text-xs text-dash-muted hover:text-dash-text"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-dash-primary hover:text-dash-primary-hover font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
