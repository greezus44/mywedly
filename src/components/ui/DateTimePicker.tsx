import { type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface DateTimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function DateTimePicker({ label, error, className, id, name, value, onChange, ...props }: DateTimePickerProps) {
  const inputId = id || name;
  // value is an ISO string; native datetime-local needs "YYYY-MM-DDTHH:mm"
  const isoValue = value ? new Date(value).toISOString().slice(0, 16) : "";
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <input
        id={inputId}
        name={name}
        type="datetime-local"
        value={isoValue}
        onChange={(e) => {
          const v = e.target.value;
          onChange?.(v ? new Date(v).toISOString() : "");
        }}
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
}
