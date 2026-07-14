import { forwardRef } from "react";
import { Input } from "./Input";
import { cn } from "../../lib/utils";

interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, value, onChange, error, className }, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        className={cn(className)}
      />
    );
  },
);
TimePicker.displayName = "TimePicker";
