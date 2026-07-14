import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface TimePickerProps {
  value?: string | null;
  onChange: (time24: string | null) => void;
  label?: string;
  className?: string;
}

function to24(h: number, m: number, period: "AM" | "PM"): string {
  let hours = h;
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parse24(time24: string | null | undefined): { hour: number; minute: number; period: "AM" | "PM" } | null {
  if (!time24) return null;
  const match = time24.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return { hour: hours, minute: minutes, period };
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = parse24(value);
  const [hour, setHour] = useState(parsed?.hour ?? 12);
  const [minute, setMinute] = useState(parsed?.minute ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed?.period ?? "AM");

  useEffect(() => {
    if (parsed) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleSelect = (h: number, m: number, p: "AM" | "PM") => {
    setHour(h);
    setMinute(m);
    setPeriod(p);
    onChange(to24(h, m, p));
  };

  const displayValue = parsed
    ? `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")} ${parsed.period}`
    : "";

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text text-left focus:outline-none focus:ring-2 focus:ring-dash-primary/30",
          !displayValue && "text-dash-muted/60"
        )}
      >
        {displayValue || "Select time"}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-3 w-64 animate-scaleIn">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-xs font-medium text-dash-muted mb-1 text-center">Hour</div>
              <div className="max-h-40 overflow-y-auto scrollbar-thin grid grid-cols-3 gap-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelect(h, minute, period)}
                    className={cn(
                      "rounded py-1 text-sm transition-colors",
                      hour === h
                        ? "bg-dash-primary text-dash-primary-fg font-semibold"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-dash-muted mb-1 text-center">Min</div>
              <div className="max-h-40 overflow-y-auto scrollbar-thin grid grid-cols-3 gap-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelect(hour, m, period)}
                    className={cn(
                      "rounded py-1 text-sm transition-colors",
                      minute === m
                        ? "bg-dash-primary text-dash-primary-fg font-semibold"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium text-dash-muted mb-1 text-center">AM/PM</div>
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelect(hour, minute, p)}
                  className={cn(
                    "rounded py-1 px-2 text-sm transition-colors",
                    period === p
                      ? "bg-dash-primary text-dash-primary-fg font-semibold"
                      : "text-dash-text hover:bg-dash-bg"
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
  );
}
