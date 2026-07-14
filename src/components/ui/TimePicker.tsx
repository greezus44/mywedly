import { useEffect, useMemo, useRef, useState } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10,...55

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    if (!value) return { hour: 12, minute: 0, period: "AM" as "AM" | "PM" };
    const h24 = parseInt(value.split(":")[0] ?? "0", 10);
    const m = parseInt(value.split(":")[1] ?? "0", 10);
    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return { hour: h12, minute: m, period };
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

  function update(h: number, m: number, p: "AM" | "PM") {
    let h24 = h;
    if (p === "PM" && h !== 12) h24 = h + 12;
    if (p === "AM" && h === 12) h24 = 0;
    const rounded = roundTo5Min(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    onChange(rounded);
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-left text-sm text-dash-text transition-colors hover:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary"
      >
        {value ? to12Hour(value) : "Select time"}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 flex gap-2 rounded-md border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
            {HOURS_12.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => update(h, parsed.minute, parsed.period)}
                className={cn(
                  "rounded px-2 py-1 text-xs hover:bg-dash-bg",
                  parsed.hour === h && "bg-dash-primary text-dash-primary-fg",
                )}
              >
                {h}
              </button>
            ))}
          </div>
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update(parsed.hour, m, parsed.period)}
                className={cn(
                  "rounded px-2 py-1 text-xs hover:bg-dash-bg",
                  parsed.minute === m && "bg-dash-primary text-dash-primary-fg",
                )}
              >
                {String(m).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-0.5">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => update(parsed.hour, parsed.minute, p)}
                className={cn(
                  "rounded px-2 py-1 text-xs hover:bg-dash-bg",
                  parsed.period === p && "bg-dash-primary text-dash-primary-fg",
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

export default TimePicker;
