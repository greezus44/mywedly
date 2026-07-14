import { useEffect, useRef, useState } from "react";
import { cn, roundTo5Min, to12Hour, to24Hour } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export function TimePicker({ value, onChange, label, placeholder = "Select time", className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<"am" | "pm">("am");
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const rounded = roundTo5Min(value);
      const h24 = parseInt(rounded.slice(0, 2), 10);
      const m = parseInt(rounded.slice(3, 5), 10);
      setPeriod(h24 >= 12 ? "pm" : "am");
      setHour(h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24);
      setMinute(m);
    }
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  function applyAndClose() {
    let h24 = hour;
    if (period === "pm" && hour < 12) h24 += 12;
    if (period === "am" && hour === 12) h24 = 0;
    const result = `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(result);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && <label className="mb-1 block text-sm font-medium text-dash-text">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text",
          "transition-colors hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/40",
        )}
      >
        {value ? to12Hour(value) : <span className="text-dash-muted">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="mb-1 text-center text-xs font-medium text-dash-muted">Hour</div>
              <div className="scrollbar-thin max-h-40 overflow-y-auto">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      "w-full rounded px-2 py-1 text-sm transition-colors",
                      hour === h ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-1 text-center text-xs font-medium text-dash-muted">Minute</div>
              <div className="scrollbar-thin max-h-40 overflow-y-auto">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={cn(
                      "w-full rounded px-2 py-1 text-sm transition-colors",
                      minute === m ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-1 text-center text-xs font-medium text-dash-muted">Period</div>
              <div>
                {(["am", "pm"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "w-full rounded px-2 py-1 text-sm uppercase transition-colors",
                      period === p ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-between border-t border-dash-border pt-2">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }} className="text-xs text-dash-muted hover:text-dash-text">
              Clear
            </button>
            <button type="button" onClick={applyAndClose} className="text-xs font-medium text-dash-primary hover:text-dash-primary-hover">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
