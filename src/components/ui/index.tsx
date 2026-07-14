import {
  useState,
  useEffect,
  type ReactNode,
  type InputHTMLAttributes,
  type CSSProperties,
} from "react";
import { cn } from "../../lib/utils";

// Re-export Input, Textarea, Select
export { Input, Textarea, Select } from "./Input";
export type { InputProps, TextareaProps, SelectProps } from "./Input";

// Re-export Button
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// Re-export FontSelect
export { FontSelect } from "./FontSelect";
export type { FontSelectProps } from "./FontSelect";

// Re-export TimePicker, DatePicker, DateTimePicker
export { TimePicker } from "./TimePicker";
export type { TimePickerProps } from "./TimePicker";
export { DatePicker } from "./DatePicker";
export type { DatePickerProps } from "./DatePicker";
export { DateTimePicker } from "./DateTimePicker";
export type { DateTimePickerProps } from "./DateTimePicker";

// --- Card ---

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface p-5 shadow-sm",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// --- Badge ---

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-dash-bg text-dash-muted border-dash-border",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// --- EmptyState ---

export interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, message, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-dash-text">{title}</h3>
      {message && <p className="mt-1 text-sm text-dash-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// --- Toggle ---

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Toggle({ checked, onChange, label, className }: ToggleProps) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-dash-primary" : "bg-dash-border"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

// --- ColorInput ---

export interface ColorInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorInput({ label, value, onChange, className }: ColorInputProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// --- RangeInput ---

export interface RangeInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function RangeInput({ label, value, onChange, min = 0, max = 100, step = 1, className }: RangeInputProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-dash-text">{label}</label>
          <span className="text-xs text-dash-muted">{value}{step < 1 ? "" : ""}</span>
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
}

// --- FormField ---

export interface FormFieldProps {
  label?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
  hint?: string;
}

export function FormField({ label, error, children, className, hint }: FormFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-dash-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}

// --- Skeleton ---

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-dash-border/50",
        className
      )}
    />
  );
}

// --- ErrorState ---

export interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-dash-text">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-dash-muted">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-dash-border px-4 py-2 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// --- LoadingSpinner ---

export interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }[size];

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        className={cn("animate-spin text-dash-primary", sizeClass)}
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
    </div>
  );
}

// --- Modal ---

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-dash-border bg-dash-surface shadow-xl animate-scaleIn",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-4">
            <h2 className="text-lg font-semibold text-dash-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
