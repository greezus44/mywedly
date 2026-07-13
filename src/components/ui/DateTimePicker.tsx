import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  label?: string;
  className?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({ date, time, onChange, label, className }: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}

      {/* Summary display */}
      <div className="mb-2 flex items-center gap-2 rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm">
        <span className={cn("flex-1", !date && "text-dash-muted")}>
          {date || "No date"}
        </span>
        <span className="text-dash-border">|</span>
        <span className={cn("flex-1 text-right", !time && "text-dash-muted")}>
          {time || "No time"}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-3 inline-flex rounded-md border border-dash-border bg-dash-bg p-1">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "rounded px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "date"
              ? "bg-dash-surface text-dash-text shadow-sm"
              : "text-dash-muted hover:text-dash-text"
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "rounded px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "time"
              ? "bg-dash-surface text-dash-text shadow-sm"
              : "text-dash-muted hover:text-dash-text"
          )}
        >
          Time
        </button>
      </div>

      {/* Active panel */}
      <div>
        {tab === "date" ? (
          <DatePicker
            value={date}
            onChange={(d) => onChange(d, time)}
          />
        ) : (
          <TimePicker
            value={time}
            onChange={(t) => onChange(date, t)}
          />
        )}
      </div>
    </div>
  );
}
