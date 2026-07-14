import { useEffect, useMemo, useRef, useState } from "react";
import { cn, roundTo5Min, to12Hour, to24Hour } from "../../lib/utils";

interface TimePickerProps {
  value: string | null; // "HH:MM" 24-hour format
  onChange: (time: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimePicker({
  value,
  onChange,
  label,
  placeholder = "Select a time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value into hour/minute/period
  const { hour, minute, period } = useMemo(() => {
    if (!value) {
      const now = roundTo5Min(new Date());
      return {
        hour: ((now.getHours() + 11) % 12) + 1,
        minute: now.getMinutes(),
        period: now.getHours() >= 12 ? "PM" as const : "AM" as const,
      };
    }
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!match) {
      return { hour: 12, minute: 0, period: "PM" as const };
    }
    const h24 = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return {
      hour: ((h24 + 11) % 12) + 1,
      minute: m,
      period: (h24 >= 12 ? "PM" : "AM") as "AM" | "PM",
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const displayValue = value ? to12Hour(value) : "";

  function commit(newHour: number, newMinute: number, newPeriod: "AM" | "PM") {
    const time12 = `${newHour}:${String(newMinute).padStart(2, "0")} ${newPeriod}`;
    const time24 = to24Hour(time12);
    if (time24) onChange(time24);
  }

  function setHour(h: number) {
    commit(h, minute, period);
  }
  function setMinute(m: number) {
    commit(hour, m, period);
  }
  function setPeriod(p: "AM" | "PM") {
    commit(hour, minute, p);
  }

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 text-sm transition-colors",
            "hover:border-dash-primary focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
          )}
        >
          <span className={displayValue ? "text-dash-text" : "text-dash-muted"}>
            {displayValue || placeholder}
          </span>
          <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 flex gap-2 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            {/* Hours */}
            <div className="flex flex-col">
              <span className="mb-1 text-center text-xs font-medium text-dash-muted">Hour</span>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {HOURS_12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      "block w-10 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                      h === hour && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex flex-col">
              <span className="mb-1 text-center text-xs font-medium text-dash-muted">Min</span>
              <div className="max-h-40 overflow-y-auto scrollbar-thin">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={cn(
                      "block w-10 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                      m === minute && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col">
              <span className="mb-1 text-center text-xs font-medium text-dash-muted">Period</span>
              <button
                type="button"
                onClick={() => setPeriod("AM")}
                className={cn(
                  "mb-1 block w-12 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                  period === "AM" && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setPeriod("PM")}
                className={cn(
                  "block w-12 rounded px-2 py-1 text-sm transition-colors hover:bg-dash-bg",
                  period === "PM" && "bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover"
                )}
              >
                PM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
