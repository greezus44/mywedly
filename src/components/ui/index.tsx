import React from "react";
import { cn } from "../../lib/utils";

export { Input, Textarea, Select } from "./Input";
export { Button } from "./Button";
export { DatePicker } from "./DatePicker";
export { TimePicker } from "./TimePicker";
export { DateTimePicker } from "./DateTimePicker";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn("rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm", className)}
    {...props}
  />
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "danger" | "warning";
}

const badgeVariants: Record<string, string> = {
  default: "bg-dash-bg text-dash-muted border-dash-border",
  primary: "bg-dash-primary/10 text-dash-primary border-dash-primary/20",
  success: "bg-green-100 text-green-700 border-green-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
};

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", ...props }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      badgeVariants[variant],
      className,
    )}
    {...props}
  />
);

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action, className }) => (
  <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
    {icon && <div className="mb-3 text-dash-muted">{icon}</div>}
    <h3 className="text-base font-medium text-dash-text">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-dash-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled }) => (
  <label className={cn("inline-flex cursor-pointer items-center gap-2", disabled && "cursor-not-allowed opacity-50")}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-dash-primary" : "bg-dash-border",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
    {label && <span className="text-sm text-dash-text">{label}</span>}
  </label>
);

interface ColorInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => (
  <div className="w-full">
    {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-md border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
      />
    </div>
  </div>
);

interface RangeInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const RangeInput: React.FC<RangeInputProps> = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
  <div className="w-full">
    {label && (
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-dash-text">{label}</label>
        <span className="text-xs text-dash-muted">{value}{label?.includes("size") || label?.includes("Size") ? "px" : ""}</span>
      </div>
    )}
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full cursor-pointer accent-dash-primary"
    />
  </div>
);

interface FormFieldProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children, className }) => (
  <div className={cn("w-full", className)}>
    {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
    {children}
    {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse rounded-md bg-dash-border", className)} />
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = "Something went wrong", message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="mb-3 text-3xl">⚠️</div>
    <h3 className="text-base font-medium text-dash-text">{title}</h3>
    {message && <p className="mt-1 max-w-sm text-sm text-dash-muted">{message}</p>}
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
      >
        Try again
      </button>
    )}
  </div>
);

export const LoadingSpinner: React.FC<{ className?: string; size?: number }> = ({ className, size = 24 }) => (
  <svg
    className={cn("animate-spin text-dash-primary", className)}
    width={size}
    height={size}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, className }) => {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-dash-border bg-dash-surface p-6 shadow-xl scrollbar-thin",
          className,
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dash-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
