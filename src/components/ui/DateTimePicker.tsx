import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onDateChange: (value: string | null) => void;
  onTimeChange: (value: string | null) => void;
  label?: string;
  className?: string;
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  label,
  className,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<"date" | "time">("date");

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className="text-sm font-medium text-dash-text">{label}</label>}
      <div className="flex gap-1 border-b border-dash-border">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "border-b-2 px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "date"
              ? "border-dash-primary text-dash-primary"
              : "border-transparent text-dash-muted hover:text-dash-text"
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "border-b-2 px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "time"
              ? "border-dash-primary text-dash-primary"
              : "border-transparent text-dash-muted hover:text-dash-text"
          )}
        >
          Time
        </button>
      </div>
      <div className="pt-1">
        {tab === "date" ? (
          <DatePicker value={date} onChange={onDateChange} />
        ) : (
          <TimePicker value={time} onChange={onTimeChange} />
        )}
      </div>
      <div className="flex gap-2 text-xs text-dash-muted">
        <span>Date: {date || "—"}</span>
        <span>•</span>
        <span>Time: {time || "—"}</span>
      </div>
    </div>
  );
}
