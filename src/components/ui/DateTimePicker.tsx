import { type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface DateTimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  clearable?: boolean;
}

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimePicker({ label, error, className, id, name, value, onChange, clearable = true, ...props }: DateTimePickerProps) {
  const inputId = id || name;
  const localValue = value ? toLocalDateTimeInput(value) : "";
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="datetime-local"
          value={localValue}
          onChange={(e) => {
            const v = e.target.value;
            onChange?.(v ? new Date(v).toISOString() : "");
          }}
          className={cn(
            "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 pr-9 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20",
            error && "border-dash-danger",
            className,
          )}
          {...props}
        />
        {clearable && localValue && (
          <button
            type="button"
            onClick={() => onChange?.("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-dash-muted hover:text-dash-text hover:bg-dash-border/40 transition-colors"
            aria-label="Clear date"
            tabIndex={-1}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}
