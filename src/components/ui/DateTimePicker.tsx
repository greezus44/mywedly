import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

export interface DateTimePickerProps {
  value: string; // ISO datetime string
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  // Try ISO format: "2024-01-15T14:30" or "2024-01-15T14:30:00"
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (match) return { date: match[1], time: match[2] };
  // Date only
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: value, time: "" };
  return { date: "", time: "" };
}

function joinDateTime(date: string, time: string): string {
  if (!date && !time) return "";
  if (!date) return "";
  if (!time) return date;
  return `${date}T${time}`;
}

export function DateTimePicker({ value, onChange, label, className }: DateTimePickerProps) {
  const { date, time } = splitDateTime(value);
  const [tab, setTab] = useState<"date" | "time">("date");

  const handleDateChange = (newDate: string) => {
    onChange(joinDateTime(newDate, time));
  };

  const handleTimeChange = (newTime: string) => {
    onChange(joinDateTime(date, newTime));
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div className="rounded-lg border border-dash-border bg-dash-surface">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              tab === "date"
                ? "border-b-2 border-dash-primary text-dash-primary"
                : "text-dash-muted hover:text-dash-text"
            )}
          >
            📅 Date
          </button>
          <button
            type="button"
            onClick={() => setTab("time")}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium transition-colors",
              tab === "time"
                ? "border-b-2 border-dash-primary text-dash-primary"
                : "text-dash-muted hover:text-dash-text"
            )}
          >
            🕐 Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker value={date} onChange={handleDateChange} placeholder="Select date" />
          ) : (
            <TimePicker value={time} onChange={handleTimeChange} />
          )}
        </div>
      </div>
      {(date || time) && (
        <p className="mt-1.5 text-xs text-dash-muted">
          {date && <span>{date}</span>}
          {date && time && <span> · </span>}
          {time && <span>{time}</span>}
        </p>
      )}
    </div>
  );
}

export default DateTimePicker;
