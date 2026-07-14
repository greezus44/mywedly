import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker, type DatePickerProps } from "./DatePicker";
import { TimePicker, type TimePickerProps } from "./TimePicker";

export interface DateTimePickerProps {
  value: { date: string | null; time: string | null };
  onChange: (val: { date: string | null; time: string | null }) => void;
  label?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

type Tab = "date" | "time";

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  className,
  minDate,
  maxDate,
}) => {
  const [tab, setTab] = useState<Tab>("date");

  const dateProps: DatePickerProps = {
    value: value.date,
    onChange: (d) => onChange({ ...value, date: d }),
    min: minDate,
    max: maxDate,
  };
  const timeProps: TimePickerProps = {
    value: value.time,
    onChange: (t) => onChange({ ...value, time: t }),
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="rounded-md border border-dash-border bg-dash-surface p-2">
        <div className="mb-2 flex gap-1">
          <button
            type="button"
            onClick={() => setTab("date")}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
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
              "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
              tab === "time"
                ? "bg-dash-primary text-dash-primary-fg"
                : "text-dash-muted hover:bg-dash-bg",
            )}
          >
            Time
          </button>
        </div>
        {tab === "date" ? <DatePicker {...dateProps} /> : <TimePicker {...timeProps} />}
      </div>
    </div>
  );
};
