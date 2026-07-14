import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select } from "./Input";
import { TimePicker } from "./TimePicker";
import { DatePicker } from "./DatePicker";
import { DateTimePicker } from "./DateTimePicker";

export { Input, Textarea, Select, TimePicker, DatePicker, DateTimePicker };

// ---------- Card ----------
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------- Badge ----------
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "primary";
}
export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-dash-bg text-dash-muted border-dash-border",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    primary: "bg-dash-primary/10 text-dash-primary border-dash-primary/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ---------- EmptyState ----------
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-dash-border bg-dash-surface/50 p-12 text-center",
        className
      )}
    >
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-dash-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Toggle ----------
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}
export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-dash-primary" : "bg-dash-border"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

// ---------- ColorInput ----------
export interface ColorInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
export function ColorInput({ label, value, onChange, className }: ColorInputProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-dash-text">{label}</span>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
        />
      </div>
    </div>
  );
}

// ---------- RangeInput ----------
export interface RangeInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}
export function RangeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: RangeInputProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-dash-text">{label}</span>
          <span className="text-sm text-dash-muted">{value}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full cursor-pointer accent-dash-primary"
      />
    </div>
  );
}

// ---------- FormField ----------
export interface FormFieldProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}
export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      {children}
      {error && <span className="block text-xs text-dash-danger">{error}</span>}
    </div>
  );
}

// ---------- Skeleton ----------
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

// ---------- ErrorState ----------
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center",
        className
      )}
    >
      <svg
        className="mb-3 h-8 w-8 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <h3 className="text-base font-semibold text-red-800">{title}</h3>
      {message && <p className="mt-1 text-sm text-red-600">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ---------- LoadingSpinner ----------
export interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}
export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizes: Record<string, string> = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };
  return (
    <svg
      className={cn("animate-spin text-dash-primary", sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------- Modal ----------
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  className?: string;
}
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
  className,
}: ModalProps) {
  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-lg bg-dash-surface shadow-xl",
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-base font-semibold text-dash-text">{title}</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-dash-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
