import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  value?: { date: string | null; time: string | null };
  onChange: (value: { date: string | null; time: string | null }) => void;
  label?: string;
  className?: string;
  min?: string;
  max?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({ value: valueProp, onChange, label, className, min, max }: DateTimePickerProps) {
  const value = valueProp ?? { date: null, time: null };
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-1">
        <div className="mb-2 flex gap-1">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "date" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
            )}
          >
            Date
          </button>
          <button
            type="button"
            onClick={() => setTab("time")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "time" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
            )}
          >
            Time
          </button>
        </div>
        {tab === "date" ? (
          <DatePicker
            value={value.date}
            onChange={(date) => onChange({ ...value, date })}
            min={min}
            max={max}
          />
        ) : (
          <TimePicker
            value={value.time}
            onChange={(time) => onChange({ ...value, time })}
          />
        )}
      </div>
      {(value.date || value.time) && (
        <p className="mt-1.5 text-sm text-dash-muted">
          {value.date && new Date(value.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {value.date && value.time && " at "}
          {value.time && (() => {
            const [h, m] = value.time.split(":");
            const hour = parseInt(h, 10);
            const period = hour >= 12 ? "PM" : "AM";
            const hour12 = hour % 12 === 0 ? 12 : hour % 12;
            return `${hour12}:${m} ${period}`;
          })()}
        </p>
      )}
    </div>
  );
}
