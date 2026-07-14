import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date?: string | null;
  time?: string | null;
  onDateChange?: (date: string | null) => void;
  onTimeChange?: (time: string | null) => void;
  className?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  minDate?: string | null;
  maxDate?: string | null;
}

type Tab = "date" | "time";

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  className,
  datePlaceholder = "Select date",
  timePlaceholder = "Select time",
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-1 mb-2 rounded-md bg-dash-bg p-1">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "flex-1 px-3 py-1.5 text-sm rounded transition-colors",
            tab === "date"
              ? "bg-dash-surface text-dash-text shadow-sm font-medium"
              : "text-dash-muted hover:text-dash-text",
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "flex-1 px-3 py-1.5 text-sm rounded transition-colors",
            tab === "time"
              ? "bg-dash-surface text-dash-text shadow-sm font-medium"
              : "text-dash-muted hover:text-dash-text",
          )}
        >
          Time
        </button>
      </div>
      {tab === "date" ? (
        <DatePicker
          value={date}
          onChange={onDateChange}
          placeholder={datePlaceholder}
          minDate={minDate}
          maxDate={maxDate}
        />
      ) : (
        <TimePicker
          value={time}
          onChange={onTimeChange}
          placeholder={timePlaceholder}
        />
      )}
    </div>
  );
}
