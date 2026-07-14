import { cn } from "../../lib/utils";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  label?: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  error?: string;
  min?: string;
  className?: string;
}

export function DateTimePicker({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  error,
  min,
  className,
}: DateTimePickerProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div className="grid grid-cols-2 gap-3">
        <DatePicker value={dateValue} onChange={onDateChange} min={min} />
        <TimePicker value={timeValue} onChange={onTimeChange} />
      </div>
      {error && <p className="text-sm text-dash-danger">{error}</p>}
    </div>
  );
}
