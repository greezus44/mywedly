import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn, to12Hour, to24Hour, roundTo5Min, formatTime12 } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = to12Hour(value);

  const [hour, setHour] = useState(parsed?.hour ?? 12);
  const [minute, setMinute] = useState(parsed ? roundTo5Min(parsed.minute) : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed?.period ?? "AM");

  // Sync state when value changes externally
  useEffect(() => {
    const p = to12Hour(value);
    if (p) {
      setHour(p.hour);
      setMinute(roundTo5Min(p.minute));
      setPeriod(p.period);
    }
  }, [value]);

  // Close on outside click
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

  const commit = useCallback(
    (h: number, m: number, p: "AM" | "PM") => {
      const time24 = to24Hour(h, m, p);
      onChange(time24);
    },
    [onChange]
  );

  const adjustHour = (delta: number) => {
    let h = hour + delta;
    if (h < 1) h = 12;
    if (h > 12) h = 1;
    setHour(h);
    commit(h, minute, period);
  };

  const adjustMinute = (delta: number) => {
    let m = minute + delta;
    if (m < 0) m = 55;
    if (m > 55) m = 0;
    setMinute(m);
    commit(hour, m, period);
  };

  const togglePeriod = () => {
    const p = period === "AM" ? "PM" : "AM";
    setPeriod(p);
    commit(hour, minute, p);
  };

  const displayValue = value ? formatTime12(value) : "";

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 transition-colors",
          "hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400",
          !displayValue && "text-gray-400"
        )}
      >
        {displayValue || "Select time…"}
      </button>

      {open && (
        <div className="absolute z-50 mt-9 rounded-lg border border-gray-200 bg-white p-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-4">
            {/* Hour */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => adjustHour(1)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-12 items-center justify-center rounded border border-gray-200 text-lg font-semibold">
                {hour}
              </div>
              <button
                type="button"
                onClick={() => adjustHour(-1)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <span className="text-lg font-semibold text-gray-400">:</span>

            {/* Minute */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => adjustMinute(5)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-12 items-center justify-center rounded border border-gray-200 text-lg font-semibold">
                {minute.toString().padStart(2, "0")}
              </div>
              <button
                type="button"
                onClick={() => adjustMinute(-5)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* AM/PM */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={togglePeriod}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-semibold transition-colors",
                  period === "AM"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={togglePeriod}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-semibold transition-colors",
                  period === "PM"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                PM
              </button>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
