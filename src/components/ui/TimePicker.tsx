import React, { useEffect, useRef, useState } from "react";
import { cn, to12Hour, to24Hour } from "../../lib/utils";

interface TimePickerProps {
  value?: string | null;
  onChange: (time: string) => void;
  label?: string;
  className?: string;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  let curHour24 = 9;
  let curMin = 0;
  if (value) {
    const parts = value.split(":");
    if (parts.length >= 2) {
      curHour24 = parseInt(parts[0], 10) || 9;
      curMin = parseInt(parts[1], 10) || 0;
    }
  }
  const curPeriod = curHour24 >= 12 ? "PM" : "AM";
  const curHour12 = curHour24 % 12 === 0 ? 12 : curHour24 % 12;

  const [selHour, setSelHour] = useState(curHour12);
  const [selMin, setSelMin] = useState(curMin);
  const [selPeriod, setSelPeriod] = useState<"AM" | "PM">(curPeriod);

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

  const commit = (h: number, m: number, p: "AM" | "PM") => {
    const time12 = `${h}:${String(m).padStart(2, "0")} ${p}`;
    const time24 = to24Hour(time12);
    onChange(time24);
  };

  const handleHourChange = (h: number) => {
    setSelHour(h);
    commit(h, selMin, selPeriod);
  };

  const handleMinChange = (m: number) => {
    setSelMin(m);
    commit(selHour, m, selPeriod);
  };

  const handlePeriodChange = (p: "AM" | "PM") => {
    setSelPeriod(p);
    commit(selHour, selMin, p);
  };

  const displayValue = value ? to12Hour(value) : "";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text transition-colors hover:bg-dash-bg focus:outline-none focus:ring-2 focus:ring-dash-primary/30",
          !displayValue && "text-dash-muted"
        )}
      >
        {displayValue || "Select time"}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 flex gap-2 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex flex-col gap-1">
            <div className="mb-1 text-xs font-medium text-dash-muted">Hour</div>
            <div className="h-32 overflow-y-auto scrollbar-thin">
              {HOURS_12.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourChange(h)}
                  className={cn(
                    "mb-0.5 block w-full rounded px-2 py-1 text-sm hover:bg-dash-bg",
                    selHour === h ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="mb-1 text-xs font-medium text-dash-muted">Min</div>
            <div className="h-32 overflow-y-auto scrollbar-thin">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinChange(m)}
                  className={cn(
                    "mb-0.5 block w-full rounded px-2 py-1 text-sm hover:bg-dash-bg",
                    selMin === m ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text"
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="mb-1 text-xs font-medium text-dash-muted">AM/PM</div>
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  "mb-0.5 block w-full rounded px-2 py-1 text-sm hover:bg-dash-bg",
                  selPeriod === p ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text"
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
}
