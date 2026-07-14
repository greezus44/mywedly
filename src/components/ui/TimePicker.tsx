import { useState, useRef, useEffect } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

export interface TimePickerProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const parsed = value ? to12Hour(value) : { hour: 12, minute: 0, period: "AM" as const };
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const p = to12Hour(value);
      setHour(p.hour);
      setMinute(p.minute);
      setPeriod(p.period);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const update = (h: number, m: number, p: "AM" | "PM") => {
    setHour(h);
    setMinute(m);
    setPeriod(p);
    onChange(to24Hour(h, m, p));
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const displayValue = value
    ? `${hour}:${String(minute).padStart(2, "0")} ${period}`
    : "";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text transition-colors hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/30",
            open && "border-dash-primary ring-2 ring-dash-primary/30"
          )}
        >
          <span className={cn(!displayValue && "text-dash-muted/60")}>
            {displayValue || "Select time"}
          </span>
          <svg className="h-4 w-4 text-dash-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            <div className="flex gap-2">
              {/* Hours */}
              <div className="max-h-48 overflow-auto scrollbar-thin">
                <p className="mb-1 text-xs font-medium text-dash-muted">Hr</p>
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => update(h, minute, period)}
                    className={cn(
                      "block w-10 rounded px-2 py-1 text-center text-sm transition-colors hover:bg-dash-bg",
                      hour === h && "bg-dash-primary text-dash-primary-fg"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
              {/* Minutes */}
              <div className="max-h-48 overflow-auto scrollbar-thin">
                <p className="mb-1 text-xs font-medium text-dash-muted">Min</p>
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update(hour, m, period)}
                    className={cn(
                      "block w-10 rounded px-2 py-1 text-center text-sm transition-colors hover:bg-dash-bg",
                      minute === m && "bg-dash-primary text-dash-primary-fg"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
              {/* AM/PM */}
              <div>
                <p className="mb-1 text-xs font-medium text-dash-muted">Period</p>
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update(hour, minute, p)}
                    className={cn(
                      "mb-1 block w-12 rounded px-2 py-1 text-center text-sm transition-colors hover:bg-dash-bg",
                      period === p && "bg-dash-primary text-dash-primary-fg"
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
    </div>
  );
}

export default TimePicker;
