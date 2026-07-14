import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  label?: string;
  className?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  label,
  className,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div className="rounded-lg border border-dash-border bg-dash-surface">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              tab === "date"
                ? "border-b-2 border-dash-primary text-dash-primary"
                : "text-dash-muted hover:text-dash-text"
            )}
          >
            Date
          </button>
          <button
            type="button"
            onClick={() => setTab("time")}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              tab === "time"
                ? "border-b-2 border-dash-primary text-dash-primary"
                : "text-dash-muted hover:text-dash-text"
            )}
          >
            Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker value={date} onChange={onDateChange} />
          ) : (
            <TimePicker value={time} onChange={onTimeChange} />
          )}
        </div>
      </div>
    </div>
  );
}
