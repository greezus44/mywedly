import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  value: { date: string | null; time: string | null };
  onChange: (val: { date: string | null; time: string | null }) => void;
  className?: string;
  label?: string;
}

export function DateTimePicker({
  value,
  onChange,
  className,
  label,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<"date" | "time">("date");

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1">
          {label}
        </label>
      )}
      <div className="rounded-lg border border-dash-border bg-dash-surface overflow-hidden">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
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
              "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "time"
                ? "bg-dash-primary text-dash-primary-fg"
                : "text-dash-text hover:bg-dash-bg"
            )}
          >
            Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker
              value={value.date}
              onChange={(date) => onChange({ ...value, date })}
            />
          ) : (
            <TimePicker
              value={value.time}
              onChange={(time) => onChange({ ...value, time })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
