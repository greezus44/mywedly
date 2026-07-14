import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  value: string | null;
  onChange: (isoDateTime: string | null) => void;
  label?: string;
  className?: string;
  min?: string | null;
  max?: string | null;
}

type Tab = "date" | "time";

export function DateTimePicker({
  value,
  onChange,
  label,
  className,
  min,
  max,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  const datePart = value ? value.split("T")[0] : null;
  const timePart = value && value.includes("T") ? value.split("T")[1].slice(0, 5) : null;

  const handleDateChange = (date: string | null) => {
    if (!date) {
      onChange(null);
      return;
    }
    const time = timePart ?? "00:00";
    onChange(`${date}T${time}:00`);
  };

  const handleTimeChange = (time: string | null) => {
    if (!datePart) {
      // If no date selected, use today
      const today = new Date().toISOString().split("T")[0];
      const t = time ?? "00:00";
      onChange(`${today}T${t}:00`);
      return;
    }
    const t = time ?? "00:00";
    onChange(`${datePart}T${t}:00`);
  };

  const displayValue = value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Select date & time";

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">
          {label}
        </label>
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
            Date
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
            Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker
              value={datePart}
              onChange={handleDateChange}
              min={min}
              max={max}
            />
          ) : (
            <TimePicker value={timePart} onChange={handleTimeChange} />
          )}
        </div>
        <div className="border-t border-dash-border px-3 py-2">
          <p className="text-xs text-dash-muted">
            {displayValue}
          </p>
        </div>
      </div>
    </div>
  );
}
