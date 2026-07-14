import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  value?: string | null;
  onChange: (isoDateTime: string | null) => void;
  label?: string;
  className?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({ value, onChange, label, className }: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  // Parse existing value into date and time parts
  let datePart: string | null = null;
  let timePart: string | null = null;

  if (value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      datePart = `${y}-${m}-${day}`;
      const h = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      timePart = `${h}:${min}`;
    }
  }

  const combine = (date: string | null, time: string | null): string | null => {
    if (!date) return null;
    const timeStr = time || "00:00";
    const d = new Date(`${date}T${timeStr}`);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleDateChange = (isoDate: string | null) => {
    onChange(combine(isoDate, timePart));
  };

  const handleTimeChange = (time: string) => {
    onChange(combine(datePart, time));
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="rounded-lg border border-dash-border bg-dash-surface">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              tab === "date"
                ? "border-b-2 border-dash-primary text-dash-primary"
                : "text-dash-muted hover:text-dash-text"
            )}
          >
            Date
          </button>
          <button
            type="button"
            onClick={() => setTab("time")}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium transition-colors",
              tab === "time"
                ? "border-b-2 border-dash-primary text-dash-primary"
                : "text-dash-muted hover:text-dash-text"
            )}
          >
            Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker value={datePart} onChange={handleDateChange} />
          ) : (
            <TimePicker value={timePart} onChange={handleTimeChange} />
          )}
        </div>
      </div>
    </div>
  );
}
