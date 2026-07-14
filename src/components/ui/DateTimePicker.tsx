import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onChange: (date: string, time: string) => void;
  className?: string;
  label?: string;
  min?: string;
  max?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({
  date,
  time,
  onChange,
  className,
  label,
  min,
  max,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div className="rounded-lg border border-dash-border bg-dash-surface overflow-hidden">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              tab === "date"
                ? "bg-dash-primary text-dash-primary-fg"
                : "text-dash-text hover:bg-dash-bg"
            )}
          >
            📅 Date
          </button>
          <button
            type="button"
            onClick={() => setTab("time")}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              tab === "time"
                ? "bg-dash-primary text-dash-primary-fg"
                : "text-dash-text hover:bg-dash-bg"
            )}
          >
            🕐 Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker
              value={date}
              onChange={(d) => onChange(d, time ?? "")}
              min={min}
              max={max}
            />
          ) : (
            <TimePicker
              value={time}
              onChange={(t) => onChange(date ?? "", t)}
            />
          )}
        </div>
        <div className="border-t border-dash-border px-3 py-2 text-xs text-dash-muted">
          {date && <span>📅 {date}</span>}
          {date && time && <span className="mx-1">•</span>}
          {time && <span>🕐 {time}</span>}
          {!date && !time && <span>No date or time selected</span>}
        </div>
      </div>
    </div>
  );
}
