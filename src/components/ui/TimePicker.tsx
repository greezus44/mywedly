import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null; // "HH:MM" 24-hour
  onChange: (time: string | null) => void;
  className?: string;
  label?: string;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  className,
  label,
  placeholder = "Select time",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Parse value into internal state
  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(":");
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const p = h >= 12 ? "PM" : "AM";
        h = h % 12;
        if (h === 0) h = 12;
        setHour(h);
        setMinute(m);
        setPeriod(p);
      }
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commit = (h: number, m: number, p: "AM" | "PM") => {
    let h24 = h % 12;
    if (p === "PM") h24 += 12;
    const time24 = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(roundTo5Min(time24));
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const displayValue = value ? to12Hour(value) : "";

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <span className="block text-sm font-medium text-dash-text mb-1">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text",
          "focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary",
        )}
      >
        <span className={cn(!value && "text-dash-muted")}>{displayValue || placeholder}</span>
        <span className="text-dash-muted">🕐</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-xl border border-dash-border bg-dash-surface p-3 shadow-lg animate-slideUp">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="mb-1 text-xs font-medium text-dash-muted">Hour</span>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setHour(h);
                      commit(h, minute, period);
                    }}
                    className={cn(
                      "block w-12 rounded px-2 py-1 text-sm",
                      hour === h ? "bg-dash-primary text-dash-primary-fg font-semibold" : "text-dash-text hover:bg-dash-bg",
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-xs font-medium text-dash-muted">Min</span>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMinute(m);
                      commit(hour, m, period);
                    }}
                    className={cn(
                      "block w-12 rounded px-2 py-1 text-sm",
                      minute === m ? "bg-dash-primary text-dash-primary-fg font-semibold" : "text-dash-text hover:bg-dash-bg",
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-xs font-medium text-dash-muted">AM/PM</span>
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPeriod(p);
                    commit(hour, minute, p);
                  }}
                  className={cn(
                    "block w-14 rounded px-2 py-1 text-sm",
                    period === p ? "bg-dash-primary text-dash-primary-fg font-semibold" : "text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full rounded-lg border border-dash-border px-3 py-1.5 text-sm text-dash-text hover:bg-dash-bg"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
