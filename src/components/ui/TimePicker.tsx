import { useState, useEffect, useRef, useMemo } from "react";
import { cn, formatTime12, to12Hour } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  label?: string;
  className?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse "HH:MM" 24-hour into { hour, minute } */
function parse24(timeStr: string | null): { hour: number; minute: number } | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (h === undefined || m === undefined) return null;
  return { hour: h, minute: m };
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parse24(value);

  // Local state for hour/minute/period while interacting
  const [hour, setHour] = useState<number>(parsed?.hour ?? 9);
  const [minute, setMinute] = useState<number>(parsed?.minute ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">((parsed?.hour ?? 9) >= 12 ? "PM" : "AM");

  // Sync internal state when value changes externally
  useEffect(() => {
    if (parsed) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.hour >= 12 ? "PM" : "AM");
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Build hour options 1-12
  const hourOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  // Build minute options 0-55 in steps of 5
  const minuteOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  function commit(h: number, m: number, p: "AM" | "PM") {
    let hour24 = h;
    if (p === "PM" && h !== 12) hour24 = h + 12;
    if (p === "AM" && h === 12) hour24 = 0;
    onChange(`${pad(hour24)}:${pad(m)}`);
  }

  function selectHour(h: number) {
    setHour(h);
    commit(h, minute, period);
  }

  function selectMinute(m: number) {
    setMinute(m);
    commit(hour, m, period);
  }

  function togglePeriod() {
    const next = period === "AM" ? "PM" : "AM";
    setPeriod(next);
    commit(hour, minute, next);
  }

  function clearTime() {
    onChange(null);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text transition-colors hover:bg-dash-bg focus:outline-none focus:ring-2 focus:ring-dash-primary"
      >
        <span className={cn(!value && "text-dash-muted")}>
          {value ? formatTime12(value) : "Select a time"}
        </span>
        <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="mb-3 text-center">
            <span className="text-lg font-semibold text-dash-text">
              {to12Hour(hour, minute)} {period}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Hours */}
            <div>
              <p className="mb-1 text-center text-xs font-medium text-dash-muted">Hour</p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-dash-border">
                {hourOptions.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => selectHour(h)}
                    className={cn(
                      "block w-full py-1 text-center text-sm transition-colors hover:bg-dash-bg",
                      hour === h && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <p className="mb-1 text-center text-xs font-medium text-dash-muted">Minute</p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-dash-border">
                {minuteOptions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMinute(m)}
                    className={cn(
                      "block w-full py-1 text-center text-sm transition-colors hover:bg-dash-bg",
                      minute === m && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover"
                    )}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div>
              <p className="mb-1 text-center text-xs font-medium text-dash-muted">Period</p>
              <div className="rounded-md border border-dash-border">
                <button
                  type="button"
                  onClick={() => period !== "AM" && togglePeriod()}
                  className={cn(
                    "block w-full py-2 text-center text-sm transition-colors hover:bg-dash-bg",
                    period === "AM" ? "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover" : "text-dash-text"
                  )}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => period !== "PM" && togglePeriod()}
                  className={cn(
                    "block w-full py-2 text-center text-sm transition-colors hover:bg-dash-bg",
                    period === "PM" ? "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover" : "text-dash-text"
                  )}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-end border-t border-dash-border pt-2">
            <button
              type="button"
              onClick={clearTime}
              className="text-xs font-medium text-dash-muted hover:text-dash-danger"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
