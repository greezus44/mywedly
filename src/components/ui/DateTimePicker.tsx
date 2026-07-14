import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  label?: string;
  className?: string;
  min?: string;
  max?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({ date, time, onChange, label, className, min, max }: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div className="inline-flex rounded-md border border-dash-border bg-dash-surface p-0.5">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-colors",
            tab === "date" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text",
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-colors",
            tab === "time" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text",
          )}
        >
          Time
        </button>
      </div>
      {tab === "date" ? (
        <DatePicker value={date} onChange={(d) => onChange(d, time)} min={min} max={max} />
      ) : (
        <TimePicker value={time} onChange={(t) => onChange(date, t)} />
      )}
      <div className="text-xs text-dash-muted">
        {date && `Date: ${date}`}
        {date && time && " · "}
        {time && `Time: ${time}`}
      </div>
    </div>
  );
}
