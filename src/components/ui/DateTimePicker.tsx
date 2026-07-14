import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  label?: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  minDate?: string;
}

export function DateTimePicker({ label, dateValue, timeValue, onDateChange, onTimeChange, minDate }: DateTimePickerProps) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="grid grid-cols-2 gap-3">
        <DatePicker value={dateValue} onChange={onDateChange} min={minDate} />
        <TimePicker value={timeValue} onChange={onTimeChange} />
      </div>
    </div>
  );
}
