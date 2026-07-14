import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  /** ISO date string "YYYY-MM-DD" or null */
  date: string | null;
  /** 24-hour time string "HH:MM" or null */
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  label?: string;
  className?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({
  date,
  time,
  onChange,
  label,
  className,
}: DateTimePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("date");

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}

      {/* Tabs */}
      <div className="mb-2 inline-flex rounded-md border border-dash-border bg-dash-bg p-0.5">
        <button
          type="button"
          onClick={() => setActiveTab("date")}
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-colors",
            activeTab === "date"
              ? "bg-dash-surface text-dash-text shadow-sm"
              : "text-dash-muted hover:text-dash-text"
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("time")}
          className={cn(
            "rounded px-3 py-1 text-sm font-medium transition-colors",
            activeTab === "time"
              ? "bg-dash-surface text-dash-text shadow-sm"
              : "text-dash-muted hover:text-dash-text"
          )}
        >
          Time
        </button>
      </div>

      {/* Active panel */}
      {activeTab === "date" ? (
        <DatePicker
          value={date}
          onChange={(d) => onChange(d, time)}
          placeholder="Select a date"
        />
      ) : (
        <TimePicker
          value={time}
          onChange={(t) => onChange(date, t)}
          placeholder="Select a time"
        />
      )}
    </div>
  );
}
