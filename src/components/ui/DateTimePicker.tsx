import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date?: string;
  time?: string;
  onChange: (date: string, time: string) => void;
  className?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({ date, time, onChange, className }: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-1 mb-2 rounded-md bg-dash-bg p-1">
        <button
          type="button"
          onClick={() => setTab("date")}
          className={cn(
            "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "date" ? "bg-dash-surface text-dash-text shadow-sm" : "text-dash-muted hover:text-dash-text"
          )}
        >
          📅 Date
        </button>
        <button
          type="button"
          onClick={() => setTab("time")}
          className={cn(
            "flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "time" ? "bg-dash-surface text-dash-text shadow-sm" : "text-dash-muted hover:text-dash-text"
          )}
        >
          🕐 Time
        </button>
      </div>
      <div>
        {tab === "date" ? (
          <DatePicker value={date} onChange={(d) => onChange(d, time ?? "")} />
        ) : (
          <TimePicker value={time} onChange={(t) => onChange(date ?? "", t)} />
        )}
      </div>
    </div>
  );
}
