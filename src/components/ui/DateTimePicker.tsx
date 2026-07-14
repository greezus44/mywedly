import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  label?: string;
  dateLabel?: string;
  timeLabel?: string;
}

type Tab = "date" | "time";

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  time,
  onChange,
  label,
  dateLabel = "Date",
  timeLabel = "Time",
}) => {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="rounded-md border border-dash-border">
        <div className="flex border-b border-dash-border">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "date"
                ? "bg-dash-primary text-dash-primary-fg"
                : "text-dash-muted hover:bg-dash-bg",
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
                : "text-dash-muted hover:bg-dash-bg",
            )}
          >
            Time
          </button>
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker value={date} onChange={(d) => onChange(d, time)} label={dateLabel} />
          ) : (
            <TimePicker value={time} onChange={(t) => onChange(date, t)} label={timeLabel} />
          )}
        </div>
      </div>
    </div>
  );
};
