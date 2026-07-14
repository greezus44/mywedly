import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  /** ISO date string (yyyy-mm-dd) */
  date: string | null;
  /** 24-hour time string (hh:mm) */
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  className?: string;
  label?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({
  date,
  time,
  onChange,
  className,
  label,
}: DateTimePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("date");

  const tabButtonClasses = (tab: Tab): string =>
    cn(
      "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
      activeTab === tab
        ? "bg-dash-surface text-dash-primary border-b-2 border-dash-primary"
        : "text-dash-muted hover:text-dash-text border-b-2 border-transparent"
    );

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          {label}
        </label>
      )}
      <div className="rounded-lg border border-dash-border bg-dash-bg/50">
        {/* Tabs */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("date")}
            className={tabButtonClasses("date")}
          >
            Date
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("time")}
            className={tabButtonClasses("time")}
          >
            Time
          </button>
        </div>
        {/* Content */}
        <div className="p-3">
          {activeTab === "date" ? (
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
    </div>
  );
}
