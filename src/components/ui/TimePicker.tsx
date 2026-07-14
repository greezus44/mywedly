import { cn } from "../../lib/utils";
import { to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  step?: number;
}

export function TimePicker({ label, value, onChange, step = 5 }: TimePickerProps) {
  const display = value ? to12Hour(value) : "";
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <input
        type="time"
        value={value}
        step={step * 60}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? roundTo5Min(v) : v);
        }}
        className={cn(
          "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
        )}
      />
      {display && <p className="mt-0.5 text-xs text-dash-muted">{display}</p>}
    </div>
  );
}
