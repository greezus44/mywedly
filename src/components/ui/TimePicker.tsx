import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, error, className, id, name, value, onChange, ...props }, ref) => {
    const inputId = id || name;
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="time"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20",
            error && "border-dash-danger",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  },
);
TimePicker.displayName = "TimePicker";
