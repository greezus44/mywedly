import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date?: string | null;
  time?: string | null;
  onDateChange: (date: string | null) => void;
  onTimeChange: (time: string | null) => void;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  className,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface", className)}>
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
          <DatePicker
            value={date}
            onChange={onDateChange}
            minDate={minDate}
            maxDate={maxDate}
          />
        ) : (
          <TimePicker value={time} onChange={onTimeChange} />
        )}
      </div>
    </div>
  );
}
