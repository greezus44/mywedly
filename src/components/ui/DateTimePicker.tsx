import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  label?: string;
  className?: string;
  min?: string;
  max?: string;
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  label,
  className,
  min,
  max,
}: DateTimePickerProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"date" | "time">("date");

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div className="flex gap-1 rounded-md border border-dash-border p-0.5 bg-dash-bg">
        <button
          type="button"
          onClick={() => setActiveTab("date")}
          className={cn(
            "flex-1 rounded px-3 py-1 text-xs font-medium transition-colors",
            activeTab === "date" ? "bg-dash-surface text-dash-text shadow-sm" : "text-dash-muted hover:text-dash-text",
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("time")}
          className={cn(
            "flex-1 rounded px-3 py-1 text-xs font-medium transition-colors",
            activeTab === "time" ? "bg-dash-surface text-dash-text shadow-sm" : "text-dash-muted hover:text-dash-text",
          )}
        >
          Time
        </button>
      </div>
      {activeTab === "date" ? (
        <DatePicker value={date} onChange={onDateChange} min={min} max={max} />
      ) : (
        <TimePicker value={time} onChange={onTimeChange} />
      )}
    </div>
  );
}
