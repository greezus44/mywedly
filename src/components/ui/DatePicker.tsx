import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className, id, value, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          type="date"
          value={value ?? ""}
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
DatePicker.displayName = "DatePicker";
