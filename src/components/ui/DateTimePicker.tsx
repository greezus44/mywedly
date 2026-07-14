import { useState } from "react";
import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  value: string | null;
  onChange: (isoDateTime: string | null) => void;
  className?: string;
  label?: string;
}

type Tab = "date" | "time";

function combine(date: string | null, time: string | null): string | null {
  if (!date) return null;
  const t = time ?? "00:00";
  return `${date}T${t}`;
}

function splitValue(value: string | null): {
  date: string | null;
  time: string | null;
} {
  if (!value) return { date: null, time: null };
  if (value.includes("T")) {
    const [d, t] = value.split("T");
    return { date: d, time: t };
  }
  return { date: value, time: null };
}

export function DateTimePicker({
  value,
  onChange,
  className,
  label,
}: DateTimePickerProps) {
  const { date: initialDate, time: initialTime } = splitValue(value);
  const [tab, setTab] = useState<Tab>("date");
  const [date, setDate] = useState<string | null>(initialDate);
  const [time, setTime] = useState<string | null>(initialTime ?? "09:00");

  const handleDate = (d: string | null) => {
    setDate(d);
    onChange(combine(d, time));
  };

  const handleTime = (t: string) => {
    setTime(t);
    onChange(combine(date, t));
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div className="flex gap-1 border-b border-border">
        {(["date", "time"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium capitalize",
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "date" ? (
        <DatePicker value={date} onChange={handleDate} />
      ) : (
        <TimePicker value={time} onChange={handleTime} />
      )}
      {value && (
        <p className="text-xs text-muted">
          {date ?? "No date"} {time ? `at ${time}` : ""}
        </p>
      )}
    </div>
  );
}
