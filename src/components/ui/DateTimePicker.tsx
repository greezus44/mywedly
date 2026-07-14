import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  value?: string;
  onChange: (isoDateTime: string) => void;
  label?: string;
  className?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({ value, onChange, label, className }: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  const datePart = value ? value.split("T")[0] : "";
  const timePart = value ? value.split("T")[1]?.slice(0, 5) ?? "" : "";

  const handleDate = (isoDate: string) => {
    const time = timePart || "09:00";
    onChange(`${isoDate}T${time}:00`);
  };

  const handleTime = (time: string) => {
    const date = datePart || new Date().toISOString().split("T")[0];
    onChange(`${date}T${time}:00`);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div className="flex gap-1 mb-2 border-b border-dash-border">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "date"
              ? "border-dash-primary text-dash-primary"
              : "border-transparent text-dash-muted hover:text-dash-text"
          )}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "time"
              ? "border-dash-primary text-dash-primary"
              : "border-transparent text-dash-muted hover:text-dash-text"
          )}
        >
          Time
        </button>
      </div>
      {tab === "date" ? (
        <DatePicker value={datePart} onChange={handleDate} />
      ) : (
        <TimePicker value={timePart} onChange={handleTime} />
      )}
    </div>
  );
}
