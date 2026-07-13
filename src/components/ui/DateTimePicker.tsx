import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  className?: string;
  label?: string;
}

export function DateTimePicker({
  date,
  time,
  onChange,
  className,
  label,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<"date" | "time">("date");

  return (
    <div className={cn("w-full", className)}>
      {label && <span className="block text-sm font-medium text-dash-text mb-1">{label}</span>}
      <div className="rounded-xl border border-dash-border bg-dash-surface overflow-hidden">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "date" ? "bg-dash-surface text-dash-primary border-b-2 border-dash-primary" : "text-dash-muted hover:text-dash-text",
            )}
          >
            📅 Date
          </button>
          <button
            type="button"
            onClick={() => setTab("time")}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "time" ? "bg-dash-surface text-dash-primary border-b-2 border-dash-primary" : "text-dash-muted hover:text-dash-text",
            )}
          >
            🕐 Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker value={date} onChange={(d) => onChange(d, time)} />
          ) : (
            <TimePicker value={time} onChange={(t) => onChange(date, t)} />
          )}
        </div>
      </div>
    </div>
  );
}
