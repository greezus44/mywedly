import { useEffect, useMemo, useRef, useState } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string) => void;
  className?: string;
  label?: string;
}

function parseTime(t: string | null): { h: number; m: number; period: "AM" | "PM" } | null {
  if (!t) return null;
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;
  const period = h >= 12 ? "PM" : "AM";
  return { h, m, period };
}

export function TimePicker({ value, onChange, className, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour, setHour] = useState<number>(parsed ? parsed.h % 12 || 12 : 12);
  const [minute, setMinute] = useState<number>(parsed ? parsed.m : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed ? parsed.period : "AM");

  useEffect(() => {
    if (parsed) {
      setHour(parsed.h % 12 || 12);
      setMinute(parsed.m);
      setPeriod(parsed.period);
    }
  }, [parsed]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function commit(h: number, m: number, p: "AM" | "PM") {
    let h24 = h;
    if (p === "PM" && h !== 12) h24 = h + 12;
    if (p === "AM" && h === 12) h24 = 0;
    const timeStr = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(roundTo5Min(timeStr));
  }

  function handleHour(h: number) {
    setHour(h);
    commit(h, minute, period);
  }

  function handleMinute(m: number) {
    setMinute(m);
    commit(hour, m, period);
  }

  function handlePeriod(p: "AM" | "PM") {
    setPeriod(p);
    commit(hour, minute, p);
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text hover:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
      >
        <span>{value ? to12Hour(value) : "Select time"}</span>
        <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 flex w-72 gap-2 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex-1">
            <p className="mb-1 text-xs font-medium text-dash-muted">Hour</p>
            <div className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto scrollbar-thin">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHour(h)}
                  className={cn(
                    "rounded px-2 py-1 text-sm transition-colors",
                    hour === h
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="mb-1 text-xs font-medium text-dash-muted">Minute</p>
            <div className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto scrollbar-thin">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinute(m)}
                  className={cn(
                    "rounded px-2 py-1 text-sm transition-colors",
                    minute === m
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="mb-1 text-xs font-medium text-dash-muted">Period</p>
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriod(p)}
                className={cn(
                  "rounded px-3 py-1 text-sm transition-colors",
                  period === p
                    ? "bg-dash-primary text-dash-primary-fg"
                    : "text-dash-text hover:bg-dash-bg"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
