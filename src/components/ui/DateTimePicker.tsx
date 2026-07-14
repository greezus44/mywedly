import React from "react";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";

interface DateTimePickerProps {
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  label?: string;
}

export function DateTimePicker({ date, time, onDateChange, onTimeChange, label }: DateTimePickerProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="flex gap-2">
        <DatePicker value={date} onChange={onDateChange} />
        <TimePicker value={time} onChange={onTimeChange} />
      </div>
    </div>
  );
}
