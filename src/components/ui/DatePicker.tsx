import { forwardRef } from "react";
import { Input } from "./Input";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onChange, error, min, max, className }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        min={min}
        max={max}
        className={cn(className)}
      />
    );
  },
);
DatePicker.displayName = "DatePicker";
