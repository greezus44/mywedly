import { useEffect, useMemo, useRef, useState } from "react";
import { cn, formatTime12, to12Hour, to24Hour } from "../../lib/utils";

interface TimePickerProps {
  value: string | null; // "HH:MM" 24-hour
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

function roundTo5(minute: number): number {
  return Math.round(minute / 5) * 5 % 60;
}

export function TimePicker({ value, onChange, label, placeholder = "Select time", className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initial = useMemo(() => to12Hour(value), [value]);
  const [hour, setHour] = useState<number>(initial.hour);
  const [minute, setMinute] = useState<number>(roundTo5(initial.minute));
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);

  useEffect(() => {
    const p = to12Hour(value);
    setHour(p.hour);
    setMinute(roundTo5(p.minute));
    setPeriod(p.period);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  const apply = () => {
    onChange(to24Hour(hour, minute, period));
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)} ref={containerRef}>
      {label && <label className="text-sm font-medium text-dash-text">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text hover:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
        >
          {value ? formatTime12(value) : <span className="text-dash-muted">{placeholder}</span>}
        </button>
        {open && (
          <div className="absolute z-30 mt-1 flex gap-3 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            {/* Hour */}
            <div className="flex flex-col gap-1">
              <span className="text-center text-xs font-medium text-dash-muted">Hour</span>
              <div className="h-40 w-14 overflow-y-auto scrollbar-thin">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      "block w-full rounded p-1.5 text-center text-sm",
                      h === hour ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            {/* Minute */}
            <div className="flex flex-col gap-1">
              <span className="text-center text-xs font-medium text-dash-muted">Min</span>
              <div className="h-40 w-14 overflow-y-auto scrollbar-thin">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={cn(
                      "block w-full rounded p-1.5 text-center text-sm",
                      m === minute ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            {/* AM/PM */}
            <div className="flex flex-col gap-1">
              <span className="text-center text-xs font-medium text-dash-muted">AM/PM</span>
              <div className="flex flex-col gap-1">
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded p-2 text-center text-sm",
                      p === period ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-end gap-1">
              <button
                type="button"
                onClick={apply}
                className="rounded bg-dash-primary px-3 py-1.5 text-xs font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
              >
                OK
              </button>
              {value && (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded border border-dash-border px-3 py-1.5 text-xs text-dash-muted hover:bg-dash-bg"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
