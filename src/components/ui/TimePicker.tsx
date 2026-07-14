import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value?: string | null;
  onChange?: (time24: string | null) => void;
  placeholder?: string;
  className?: string;
}

function parseTime(time24: string | null | undefined): { hours: number; minutes: number } | null {
  if (!time24) return null;
  const match = time24.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    hours: parseInt(match[1], 10),
    minutes: parseInt(match[2], 10),
  };
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ..., 55

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ value, onChange, placeholder = "Select time", className }, ref) => {
    const [open, setOpen] = useState(false);
    const [period, setPeriod] = useState<"AM" | "PM">("AM");
    const [hour12, setHour12] = useState<number>(12);
    const [minute, setMinute] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const parsed = useMemo(() => parseTime(value), [value]);

    useEffect(() => {
      if (parsed) {
        let h = parsed.hours;
        const m = Math.round(parsed.minutes / 5) * 5;
        const isPM = h >= 12;
        if (isPM) {
          setPeriod("PM");
          h = h === 12 ? 12 : h - 12;
        } else {
          setPeriod("AM");
          h = h === 0 ? 12 : h;
        }
        setHour12(h);
        setMinute(m === 60 ? 0 : m);
      }
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

    function commit(newHour12: number, newMinute: number, newPeriod: "AM" | "PM") {
      let h = newHour12;
      if (newPeriod === "PM" && h !== 12) h += 12;
      if (newPeriod === "AM" && h === 12) h = 0;
      const time24 = `${String(h).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`;
      onChange?.(roundTo5Min(time24));
    }

    function handleHour(h: number) {
      setHour12(h);
      commit(h, minute, period);
    }

    function handleMinute(m: number) {
      setMinute(m);
      commit(hour12, m, period);
    }

    function handlePeriod(p: "AM" | "PM") {
      setPeriod(p);
      commit(hour12, minute, p);
    }

    const displayValue = parsed ? to12Hour(value) : "";

    return (
      <div ref={containerRef} className="relative">
        <input
          ref={ref}
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-dash-primary cursor-pointer",
            className,
          )}
        />
        {open && (
          <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-3 w-64">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="text-xs font-medium text-dash-muted mb-1 text-center">Hour</div>
                <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto scrollbar-thin">
                  {HOURS_12.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleHour(h)}
                      className={cn(
                        "h-8 rounded text-sm transition-colors",
                        hour12 === h
                          ? "bg-dash-primary text-dash-primary-fg"
                          : "text-dash-text hover:bg-dash-bg",
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-dash-muted mb-1 text-center">Minute</div>
                <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto scrollbar-thin">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMinute(m)}
                      className={cn(
                        "h-8 rounded text-sm transition-colors",
                        minute === m
                          ? "bg-dash-primary text-dash-primary-fg"
                          : "text-dash-text hover:bg-dash-bg",
                      )}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3 justify-center">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePeriod(p)}
                  className={cn(
                    "px-4 py-1.5 rounded text-sm font-medium transition-colors",
                    period === p
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-text border border-dash-border hover:bg-dash-bg",
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
  },
);
TimePicker.displayName = "TimePicker";
