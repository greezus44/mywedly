import React, { useState } from "react";
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

export function DateTimePicker({ date, time, onChange, label, className }: DateTimePickerProps) {
  const [tab, setTab] = useState<"date" | "time">("date");

  return (
    <div className={cn("", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div className="rounded-lg border border-dash-border bg-dash-surface overflow-hidden">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", tab === "date" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg")}
          >
            Date
          </button>
          <button
            type="button"
            onClick={() => setTab("time")}
            className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", tab === "time" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg")}
          >
            Time
          </button>
        </div>
        <div className="p-2">
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
