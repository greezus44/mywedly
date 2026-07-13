import React, { useState, useRef, useEffect } from "react";
import { cn, formatTime12, to12Hour } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  label?: string;
  className?: string;
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  let initHour = 10, initMin = 0;
  let initPeriod: "AM" | "PM" = "AM";
  if (value) {
    const [h, m] = value.split(":").map(Number);
    initHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    initMin = m || 0;
    initPeriod = (h || 0) >= 12 ? "PM" : "AM";
  }

  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMin);
  const [period, setPeriod] = useState<"AM" | "PM">(initPeriod);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function apply() {
    let h = hour;
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const timeStr = `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(timeStr);
    setOpen(false);
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className={cn("relative", className)} ref={ref}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-dash-border bg-dash-surface px-3.5 py-2.5 text-sm text-dash-text text-left hover:border-dash-primary/50 transition-colors"
      >
        {value ? formatTime12(value) : "Select time..."}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-56 rounded-lg border border-dash-border bg-dash-surface shadow-lg p-3 animate-slideUp">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-xs text-dash-muted mb-1 text-center">Hour</div>
              <div className="max-h-32 overflow-y-auto scrollbar-thin">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      "w-full py-1 text-sm rounded transition-colors",
                      hour === h ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-dash-muted mb-1 text-center">Min</div>
              <div className="max-h-32 overflow-y-auto scrollbar-thin">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={cn(
                      "w-full py-1 text-sm rounded transition-colors",
                      minute === m ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-dash-muted mb-1 text-center">AM/PM</div>
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "w-full py-1 text-sm rounded transition-colors mb-1",
                    period === p ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm font-medium text-dash-text">{to12Hour(hour, minute)} {period}</span>
            <button type="button" onClick={apply} className="px-3 py-1 rounded bg-dash-primary text-dash-primary-fg text-sm font-medium">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
