import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  value?: string | null;
  onChange: (isoDateTime: string | null) => void;
  label?: string;
  className?: string;
  min?: string;
  max?: string;
}

function combineDateTime(dateIso: string | null, time24: string | null): string | null {
  if (!dateIso) return null;
  if (!time24) return dateIso;
  return `${dateIso}T${time24}`;
}

function splitDateTime(iso: string | null | undefined): { date: string | null; time: string | null } {
  if (!iso) return { date: null, time: null };
  const [datePart, timePart] = iso.split("T");
  return { date: datePart ?? null, time: timePart ?? null };
}

export function DateTimePicker({ value, onChange, label, className, min, max }: DateTimePickerProps) {
  const [tab, setTab] = useState<"date" | "time">("date");
  const { date, time } = splitDateTime(value);

  const handleDateChange = (newDate: string | null) => {
    onChange(combineDateTime(newDate, time));
  };

  const handleTimeChange = (newTime: string | null) => {
    onChange(combineDateTime(date, newTime));
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div className="rounded-lg border border-dash-border bg-dash-surface overflow-hidden">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "date"
                ? "bg-dash-primary text-dash-primary-fg"
                : "text-dash-muted hover:bg-dash-bg"
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
                : "text-dash-muted hover:bg-dash-bg"
            )}
          >
            Time
          </button>
        </div>
        <div className="p-2">
          {tab === "date" ? (
            <DatePicker value={date} onChange={handleDateChange} min={min} max={max} />
          ) : (
            <TimePicker value={time} onChange={handleTimeChange} />
          )}
        </div>
      </div>
      {value && (
        <p className="mt-1 text-xs text-dash-muted">
          {date || "No date"}{time ? ` at ${time}` : ""}
        </p>
      )}
    </div>
  );
}
