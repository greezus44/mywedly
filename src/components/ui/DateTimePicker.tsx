import { useState } from "react";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { cn } from "../../lib/utils";

interface DateTimePickerProps {
  dateValue: string;
  timeValue: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  label?: string;
}

type Tab = "date" | "time";

export function DateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  label,
}: DateTimePickerProps) {
  const [tab, setTab] = useState<Tab>("date");

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <div className="rounded-md border border-dash-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-dash-border bg-dash-surface-alt">
          {(["date", "time"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors capitalize",
                tab === t
                  ? "bg-dash-surface text-dash-text border-b-2 border-dash-primary"
                  : "text-dash-muted hover:text-dash-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-3">
          {tab === "date" ? (
            <DatePicker value={dateValue} onChange={onDateChange} />
          ) : (
            <TimePicker value={timeValue} onChange={onTimeChange} />
          )}
        </div>
      </div>
    </div>
  );
}
