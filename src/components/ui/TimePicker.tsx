import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string) => void;
  className?: string;
  label?: string;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function TimePicker({ value, onChange, className, label }: TimePickerProps) {
  const normalized = useMemo(() => {
    if (!value) return "09:00";
    return roundTo5Min(value);
  }, [value]);

  const [hStr, mStr] = normalized.split(":");
  const initialHour = parseInt(hStr, 10);
  const initialMinute = parseInt(mStr, 10);
  const isPM = initialHour >= 12;
  const displayHour = initialHour % 12 === 0 ? 12 : initialHour % 12;

  const [hour, setHour] = useState(displayHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState<"AM" | "PM">(isPM ? "PM" : "AM");

  const emit = (h: number, m: number, p: "AM" | "PM") => {
    let h24 = h % 12;
    if (p === "PM") h24 += 12;
    if (h === 12 && p === "AM") h24 = 0;
    if (h === 12 && p === "PM") h24 = 12;
    onChange(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const handleHour = (h: number) => {
    setHour(h);
    emit(h, minute, period);
  };

  const handleMinute = (m: number) => {
    setMinute(m);
    emit(hour, m, period);
  };

  const handlePeriod = (p: "AM" | "PM") => {
    setPeriod(p);
    emit(hour, minute, p);
  };

  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <select
            value={hour}
            onChange={(e) => handleHour(Number(e.target.value))}
            className="h-10 rounded-md border border-border bg-surface px-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {HOURS_12.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <span className="text-lg text-muted">:</span>
        <div className="flex flex-col gap-1">
          <select
            value={minute}
            onChange={(e) => handleMinute(Number(e.target.value))}
            className="h-10 rounded-md border border-border bg-surface px-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {minutes.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex overflow-hidden rounded-md border border-border">
            {(["AM", "PM"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriod(p)}
                className={cn(
                  "h-10 px-3 text-sm font-medium",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-foreground hover:bg-muted/20"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
