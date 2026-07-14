import React from "react";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select } from "./Input";
import { TimePicker } from "./TimePicker";
import { DatePicker } from "./DatePicker";
import { DateTimePicker } from "./DateTimePicker";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-dash-bg text-dash-text border-dash-border",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        BADGE_VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-dash-border bg-dash-surface p-10 text-center">
      {icon && <div className="text-dash-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {description && <p className="max-w-md text-sm text-dash-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("inline-flex items-center gap-2", disabled && "opacity-50 cursor-not-allowed")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-dash-primary" : "bg-dash-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
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
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-dash-text">{label}</span>}
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
          className="w-24 rounded-md border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text"
        />
      </div>
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
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-dash-text">{label}</span>
          <span className="text-xs text-dash-muted">{value}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-dash-primary"
      />
    </div>
  );
}

export function FormField({
  label,
  error,
  children,
  htmlFor,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      {children}
      {error && <span className="text-xs text-dash-danger">{error}</span>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-dash-border/60", className)} />;
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dash-border bg-dash-surface p-8 text-center">
      <p className="text-sm text-dash-danger">{message ?? "Something went wrong."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
        >
          Retry
        </button>
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
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

type ModalSize = "sm" | "md" | "lg" | "xl";
const MODAL_SIZES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-fadeIn" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full rounded-lg border border-dash-border bg-dash-surface shadow-xl animate-slideUp",
          MODAL_SIZES[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-base font-semibold text-dash-text">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-dash-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export { Input, Textarea, Select, TimePicker, DatePicker, DateTimePicker };
