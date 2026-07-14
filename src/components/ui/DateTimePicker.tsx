import React, { useState } from "react";
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
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium text-dash-text">{label}</span>}
      <div className="inline-flex w-fit rounded-md border border-dash-border bg-dash-bg p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "rounded px-3 py-1 font-medium transition-colors",
            tab === "date" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text"
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "rounded px-3 py-1 font-medium transition-colors",
            tab === "time" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text"
          )}
        >
          Time
        </button>
      </div>
      {tab === "date" ? (
        <DatePicker value={date} onChange={(d) => onChange(d, time)} />
      ) : (
        <TimePicker value={time} onChange={(t) => onChange(date, t)} />
      )}
      <div className="text-xs text-dash-muted">
        {date || "No date"} {time ? `at ${time}` : ""}
      </div>
    </div>
  );
}
