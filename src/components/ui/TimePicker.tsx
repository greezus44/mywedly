import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn, to12Hour, to24Hour } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (hhmm: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

function buildHourOptions() {
  const hours: { value: number; label: string }[] = [];
  for (let h = 1; h <= 12; h++) {
    hours.push({ value: h, label: String(h) });
  }
  return hours;
}

function buildMinuteOptions() {
  const minutes: { value: number; label: string }[] = [];
  for (let m = 0; m < 60; m += 5) {
    minutes.push({ value: m, label: String(m).padStart(2, "0") });
  }
  return minutes;
}

const HOURS = buildHourOptions();
const MINUTES = buildMinuteOptions();

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select time",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    if (!value) return null;
    const parts = value.split(":");
    if (parts.length < 2) return null;
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return { hour: displayHour, minute: Math.round(m / 5) * 5, period };
  }, [value]);

  const [hour, setHour] = useState<number>(parsed?.hour ?? 12);
  const [minute, setMinute] = useState<number>(parsed?.minute ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed?.period ?? "AM");

  useEffect(() => {
    if (parsed) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    }
  }, [parsed]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function commit(newHour: number, newMinute: number, newPeriod: "AM" | "PM") {
    const twelve = `${newHour}:${String(newMinute).padStart(2, "0")} ${newPeriod}`;
    const hhmm = to24Hour(twelve);
    if (hhmm) onChange(hhmm);
  }

  const displayValue = value ? to12Hour(value) : "";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text transition-colors hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
      >
        <span className={displayValue ? "text-dash-text" : "text-dash-muted"}>
          {displayValue || placeholder}
        </span>
        <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 flex w-full gap-2 rounded-md border border-dash-border bg-dash-surface p-3 shadow-lg">
          <select
            value={hour}
            onChange={(e) => {
              const v = Number(e.target.value);
              setHour(v);
              commit(v, minute, period);
            }}
            className="h-9 rounded border border-dash-border bg-dash-surface px-2 text-sm text-dash-text"
          >
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
          <select
            value={minute}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMinute(v);
              commit(hour, v, period);
            }}
            className="h-9 rounded border border-dash-border bg-dash-surface px-2 text-sm text-dash-text"
          >
            {MINUTES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <div className="flex flex-col gap-1">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPeriod(p);
                  commit(hour, minute, p);
                }}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  period === p
                    ? "bg-dash-primary text-dash-primary-fg"
                    : "bg-dash-bg text-dash-muted hover:bg-dash-border",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="self-end text-xs text-dash-muted hover:text-dash-danger"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};
