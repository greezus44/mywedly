import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select } from "./Input";
import { TimePicker } from "./TimePicker";
import { DatePicker } from "./DatePicker";
import { DateTimePicker } from "./DateTimePicker";

export { Input, Textarea, Select, TimePicker, DatePicker, DateTimePicker };

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface shadow-sm", className)}>
      {children}
    </div>
  );
}

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "bg-dash-bg text-dash-text border-dash-border",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariantClasses[variant],
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
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-dash-muted max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
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
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className="text-sm font-medium text-dash-text">{label}</label>}
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
          className="flex-1 rounded-md border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
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
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dash-text">{label}</label>
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
        className="w-full cursor-pointer accent-dash-primary"
      />
    </div>
  );
}

export function FormField({
  label,
  error,
  children,
  className,
  hint,
}: {
  label?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-dash-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-dash-border/50", className)} />;
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
      </div>
      <p className="text-sm text-dash-text">{message ?? "Something went wrong."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ className, size }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };
  return (
    <svg
      className={cn("animate-spin text-dash-primary", sizeClasses[size ?? "md"], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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

export type ModalSize = "sm" | "md" | "lg" | "xl";

const modalSizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-lg border border-dash-border bg-dash-surface shadow-xl",
          modalSizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-4 py-3">
            <h2 className="text-lg font-semibold text-dash-text">{title}</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
