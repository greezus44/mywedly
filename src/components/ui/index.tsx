import React, { forwardRef, useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { Input, Textarea, Select } from "./Input";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { DateTimePicker } from "./DateTimePicker";

export { Button };
export { Input, Textarea, Select };
export { DatePicker, TimePicker, DateTimePicker };

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  children,
  variant = "default",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "primary";
}) {
  const variants: Record<string, string> = {
    default: "bg-dash-bg text-dash-muted border-dash-border",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    primary: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
    >
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-sm font-semibold text-dash-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-dash-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  className,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className,
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
          checked ? "bg-dash-primary" : "bg-dash-border",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

export function ColorInput({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-dash-text whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-md border border-dash-border bg-dash-surface px-2 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
      />
    </div>
  );
}

export function RangeInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-dash-text">{label}</span>
          <span className="text-sm text-dash-muted">{value}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-dash-primary cursor-pointer"
      />
    </div>
  );
}

export function FormField({
  label,
  error,
  children,
  className,
  required,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          {label}
          {required && <span className="text-dash-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-dash-bg",
        className,
      )}
    />
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
    >
      <div className="mb-4 text-dash-danger">
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
          />
        </svg>
      </div>
      <p className="text-sm text-dash-text mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin h-5 w-5 text-dash-primary", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-lg bg-dash-surface shadow-xl animate-scaleIn",
          sizeClasses[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h3 className="text-base font-semibold text-dash-text">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-dash-muted hover:text-dash-text rounded p-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
