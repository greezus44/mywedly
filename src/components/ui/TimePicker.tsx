import React, { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { Input } from "./Input";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  label?: string;
  placeholder?: string;
}

function from24ToParts(time24: string | null): { hour: number; minute: number; period: "AM" | "PM" } | null {
  if (!time24) return null;
  const match = time24.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return { hour, minute, period };
}

function to24Hour(hour: number, minute: number, period: "AM" | "PM"): string {
  let h = hour;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select a time",
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const parts = useMemo(() => from24ToParts(value), [value]);
  const [hour, setHour] = useState(parts?.hour ?? 12);
  const [minute, setMinute] = useState(parts?.minute ?? 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parts?.period ?? "AM");

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);

  const displayValue = parts
    ? `${parts.hour}:${String(parts.minute).padStart(2, "0")} ${parts.period}`
    : "";

  const selectTime = (h: number, m: number, p: "AM" | "PM") => {
    setHour(h);
    setMinute(m);
    setPeriod(p);
    onChange(to24Hour(h, m, p));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        label={label}
        readOnly
        value={displayValue}
        placeholder={placeholder}
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer"
      />
      {open && (
        <div className="absolute z-50 mt-1 flex gap-2 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex flex-col gap-1">
            <div className="mb-1 text-center text-xs font-medium text-dash-muted">Hr</div>
            <div className="max-h-40 overflow-y-auto scrollbar-thin">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => selectTime(h, minute, period)}
                  className={cn(
                    "block w-full rounded px-3 py-1 text-sm",
                    h === hour ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="mb-1 text-center text-xs font-medium text-dash-muted">Min</div>
            <div className="max-h-40 overflow-y-auto scrollbar-thin">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectTime(hour, m, period)}
                  className={cn(
                    "block w-full rounded px-3 py-1 text-sm",
                    m === minute ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="mb-1 text-center text-xs font-medium text-dash-muted">AM/PM</div>
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectTime(hour, minute, p)}
                className={cn(
                  "block w-full rounded px-3 py-1 text-sm",
                  p === period ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
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
};
