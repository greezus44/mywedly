import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value?: string | null;
  onChange: (time: string) => void;
  label?: string;
  className?: string;
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hour24 = value ? value.split(":")[0] : "";
  const minute = value ? value.split(":")[1] : "";

  const hours: number[] = [];
  for (let i = 0; i < 24; i++) hours.push(i);

  const minutes: number[] = [];
  for (let i = 0; i < 60; i += 5) minutes.push(i);

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

  const handleHourChange = (h: number) => {
    const m = minute || "00";
    onChange(roundTo5Min(`${String(h).padStart(2, "0")}:${m}`));
  };

  const handleMinuteChange = (m: number) => {
    const h = hour24 || "00";
    onChange(roundTo5Min(`${h}:${String(m).padStart(2, "0")}`));
  };

  const handlePeriodChange = (period: "AM" | "PM") => {
    if (!value) {
      onChange(period === "AM" ? "00:00" : "12:00");
      return;
    }
    const current12 = to12Hour(value);
    const new12 = current12.replace(/\s*(AM|PM)$/i, ` ${period}`);
    onChange(to24Hour(new12));
  };

  const currentPeriod = value ? (parseInt(hour24, 10) >= 12 ? "PM" : "AM") : "AM";

  const displayValue = value ? to12Hour(value) : "";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text shadow-sm transition-colors hover:border-dash-primary/50 focus:outline-none focus:ring-2 focus:ring-dash-primary/20"
      >
        {displayValue || "Select time…"}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 flex w-full max-w-xs gap-2 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="h-40 flex-1 overflow-y-auto scrollbar-thin">
            <div className="mb-1 text-xs font-medium text-dash-muted">Hour</div>
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleHourChange(h)}
                className={cn(
                  "block w-full rounded px-2 py-1 text-left text-sm transition-colors hover:bg-dash-primary/10",
                  hour24 === String(h).padStart(2, "0") && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover",
                )}
              >
                {to12Hour(`${String(h).padStart(2, "0")}:00`).replace(/:\d{2}\s*(AM|PM)/, " $1")}
              </button>
            ))}
          </div>
          <div className="h-40 flex-1 overflow-y-auto scrollbar-thin">
            <div className="mb-1 text-xs font-medium text-dash-muted">Min</div>
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleMinuteChange(m)}
                className={cn(
                  "block w-full rounded px-2 py-1 text-left text-sm transition-colors hover:bg-dash-primary/10",
                  minute === String(m).padStart(2, "0") && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover",
                )}
              >
                {String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <div className="mb-1 text-xs font-medium text-dash-muted">Period</div>
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  "rounded px-3 py-1 text-sm transition-colors hover:bg-dash-primary/10",
                  currentPeriod === p && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover",
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
