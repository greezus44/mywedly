import React, { useEffect } from "react";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select } from "./Input";
import { Button } from "./Button";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { DateTimePicker } from "./DateTimePicker";

// Re-exports
export { Input, Textarea, Select };
export { Button };
export { DatePicker };
export { TimePicker };
export { DateTimePicker };

// ---- Card ----
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}
export const Card: React.FC<CardProps> = ({ className, hover, children, ...props }) => (
  <div
    className={cn(
      "rounded-lg border border-dash-border bg-dash-surface p-5 shadow-sm",
      hover && "transition-shadow hover:shadow-md",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

// ---- Badge ----
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}
const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-dash-bg text-dash-muted border-dash-border",
  primary: "bg-dash-primary/10 text-dash-primary border-dash-primary/30",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};
export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      badgeVariants[variant],
      className,
    )}
    {...props}
  >
    {children}
  </span>
);

// ---- EmptyState ----
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action, className }) => (
  <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed border-dash-border p-8 text-center", className)}>
    {icon && <div className="mb-3 text-dash-muted">{icon}</div>}
    <h3 className="text-sm font-semibold text-dash-text">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-dash-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ---- Toggle ----
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, className, disabled }) => (
  <label className={cn("inline-flex items-center gap-2", className)}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-dash-primary" : "bg-dash-border",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
    {label && <span className="text-sm text-dash-text">{label}</span>}
  </label>
);

// ---- ColorInput ----
export interface ColorInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}
export const ColorInput: React.FC<ColorInputProps> = ({ value, onChange, label, className }) => (
  <div className={cn("w-full", className)}>
    {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-1"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 flex-1 rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
      />
    </div>
  </div>
);

// ---- RangeInput ----
export interface RangeInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  format?: (value: number) => string;
}
export const RangeInput: React.FC<RangeInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  className,
  format,
}) => (
  <div className={cn("w-full", className)}>
    {label && (
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-dash-text">{label}</label>
        <span className="text-sm text-dash-muted">{format ? format(value) : value}</span>
      </div>
    )}
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-dash-border accent-dash-primary"
    />
  </div>
);

// ---- FormField ----
export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}
export const FormField: React.FC<FormFieldProps> = ({ label, error, required, className, children }) => (
  <div className={cn("w-full", className)}>
    {label && (
      <label className="mb-1.5 block text-sm font-medium text-dash-text">
        {label}
        {required && <span className="ml-0.5 text-dash-danger">*</span>}
      </label>
    )}
    {children}
    {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
  </div>
);

// ---- Skeleton ----
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}
export const Skeleton: React.FC<SkeletonProps> = ({ className, lines, ...props }) => {
  if (lines && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn("h-4 w-full animate-pulse rounded bg-dash-border", i === lines - 1 && "w-2/3")}
          />
        ))}
      </div>
    );
  }
  return <div className={cn("animate-pulse rounded bg-dash-border", className)} {...props} />;
};

// ---- ErrorState ----
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}) => (
  <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface p-8 text-center", className)}>
    <svg className="mb-3 h-10 w-10 text-dash-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 className="text-sm font-semibold text-dash-text">{title}</h3>
    {message && <p className="mt-1 max-w-sm text-sm text-dash-muted">{message}</p>}
    {onRetry && (
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

// ---- LoadingSpinner ----
export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}
const spinnerSizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md", className, label }) => (
  <div className={cn("inline-flex items-center gap-2", className)} role="status" aria-label={label ?? "Loading"}>
    <svg className={cn("animate-spin text-dash-primary", spinnerSizes[size])} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
    {label && <span className="text-sm text-dash-muted">{label}</span>}
  </div>
);

// ---- Modal ----
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}
const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, className, size = "md" }) => {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          "relative z-10 w-full rounded-lg border border-dash-border bg-dash-surface shadow-xl",
          modalSizes[size],
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-base font-semibold text-dash-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};
