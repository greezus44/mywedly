import React, { useState, useRef, useEffect } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  label?: string;
  className?: string;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function parseTime(time: string | null): { hour: number; minute: number; period: "AM" | "PM" } | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: hour12, minute: m, period };
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const initial = parseTime(value);
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState<number>(initial?.hour ?? 12);
  const [minute, setMinute] = useState<number>(initial?.minute ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">(initial?.period ?? "AM");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseTime(value);
    if (p) {
      setHour(p.hour);
      setMinute(p.minute);
      setPeriod(p.period);
    }
  }, [value]);

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

  const commit = (h: number, m: number, p: "AM" | "PM") => {
    let hour24 = h;
    if (p === "AM" && h === 12) hour24 = 0;
    if (p === "PM" && h !== 12) hour24 = h + 12;
    const rounded = roundTo5Min(`${hour24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    onChange(rounded);
  };

  const display = value ? to12Hour(value) : "Select time";

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1", className)}>
      {label && <span className="text-sm font-medium text-dash-text">{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text hover:border-dash-primary/50"
      >
        {display}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 flex gap-3 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
            {HOURS_12.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setHour(h);
                  commit(h, minute, period);
                }}
                className={cn(
                  "rounded px-3 py-1 text-sm hover:bg-dash-primary/10",
                  hour === h && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary"
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMinute(m);
                  commit(hour, m, period);
                }}
                className={cn(
                  "rounded px-3 py-1 text-sm hover:bg-dash-primary/10",
                  minute === m && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary"
                )}
              >
                {m.toString().padStart(2, "0")}
              </button>
            ))}
          </div>
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
                  "rounded px-3 py-1 text-sm hover:bg-dash-primary/10",
                  period === p && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-8 top-8 text-xs text-dash-muted hover:text-dash-text"
          aria-label="Clear time"
        >
          ✕
        </button>
      )}
    </div>
  );
}
