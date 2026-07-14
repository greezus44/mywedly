import React, { useMemo, useState } from "react";
import { cn } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (time24: string | null) => void;
  className?: string;
  label?: string;
}

function parseTime(time24: string | null): { hour: number; minute: number } | null {
  if (!time24) return null;
  const [h, m] = time24.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { hour: h, minute: m };
}

function toTime24(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h = hour12;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function fromTime24(time24: string | null): {
  hour: number;
  minute: number;
  period: "AM" | "PM";
} {
  const parsed = parseTime(time24);
  if (!parsed) return { hour: 12, minute: 0, period: "PM" };
  const { hour, minute } = parsed;
  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return { hour: hour12, minute, period };
}

function roundMinute(min: number): number {
  return Math.round(min / 5) * 5 % 60;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

export function TimePicker({ value, onChange, className, label }: TimePickerProps) {
  const initial = fromTime24(value);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(roundMinute(initial.minute));
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);
  const [open, setOpen] = useState(false);

  const displayValue = useMemo(() => {
    if (!value) return "";
    const { hour: h, period: p } = fromTime24(value);
    const parsed = parseTime(value);
    if (!parsed) return "";
    return `${h}:${String(parsed.minute).padStart(2, "0")} ${p}`;
  }, [value]);

  const emit = (h: number, m: number, p: "AM" | "PM") => {
    onChange(toTime24(h, m, p));
  };

  return (
    <div className={cn("relative w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30",
          !displayValue && "text-dash-muted/60"
        )}
      >
        {displayValue || "Select a time"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
            <div className="flex gap-2">
              {/* Hours */}
              <div className="flex-1">
                <div className="mb-1 text-center text-xs font-medium text-dash-muted">
                  Hour
                </div>
                <div className="max-h-40 overflow-y-auto rounded border border-dash-border scrollbar-thin">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setHour(h);
                        emit(h, minute, period);
                      }}
                      className={cn(
                        "block w-full px-2 py-1 text-sm text-dash-text hover:bg-dash-bg",
                        hour === h && "bg-dash-primary text-dash-primary-fg font-medium"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              {/* Minutes */}
              <div className="flex-1">
                <div className="mb-1 text-center text-xs font-medium text-dash-muted">
                  Min
                </div>
                <div className="max-h-40 overflow-y-auto rounded border border-dash-border scrollbar-thin">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMinute(m);
                        emit(hour, m, period);
                      }}
                      className={cn(
                        "block w-full px-2 py-1 text-sm text-dash-text hover:bg-dash-bg",
                        minute === m && "bg-dash-primary text-dash-primary-fg font-medium"
                      )}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
              {/* AM/PM */}
              <div className="flex flex-col gap-1">
                <div className="mb-1 text-center text-xs font-medium text-dash-muted">
                  &nbsp;
                </div>
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      emit(hour, minute, p);
                    }}
                    className={cn(
                      "rounded border px-3 py-1 text-sm font-medium transition-colors",
                      period === p
                        ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                        : "border-dash-border text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
