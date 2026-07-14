import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
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
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div className="inline-flex rounded-lg border border-dash-border bg-dash-surface p-0.5">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "px-3 py-1 text-sm font-medium rounded-md transition-colors",
            tab === "date"
              ? "bg-dash-primary text-dash-primary-fg"
              : "text-dash-text hover:bg-dash-bg"
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "px-3 py-1 text-sm font-medium rounded-md transition-colors",
            tab === "time"
              ? "bg-dash-primary text-dash-primary-fg"
              : "text-dash-text hover:bg-dash-bg"
          )}
        >
          Time
        </button>
      </div>
      <div>
        {tab === "date" ? (
          <DatePicker value={date} onChange={(d) => onChange(d, time)} />
        ) : (
          <TimePicker value={time} onChange={(t) => onChange(date, t)} />
        )}
      </div>
      {(date || time) && (
        <p className="text-xs text-dash-muted">
          {date && time
            ? `${date} at ${time}`
            : date
            ? `Date: ${date}`
            : time
            ? `Time: ${time}`
            : ""}
        </p>
      )}
    </div>
  );
}
