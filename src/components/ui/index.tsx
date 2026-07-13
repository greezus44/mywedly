import { type ReactNode, type ChangeEvent } from "react";
import { cn } from "../../lib/utils";

/* Re-export form field components */
export { Input, Textarea, Select } from "./Input";
export type { InputProps, TextareaProps, SelectProps } from "./Input";

/* Re-export date/time pickers */
export { TimePicker } from "./TimePicker";
export type { TimePickerProps } from "./TimePicker";
export { DatePicker } from "./DatePicker";
export type { DatePickerProps } from "./DatePicker";
export { DateTimePicker } from "./DateTimePicker";
export type { DateTimePickerProps } from "./DateTimePicker";

/* ----------------------------------- Card ----------------------------------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- Badge ----------------------------------- */

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-dash-bg text-dash-text border-dash-border",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger: "bg-red-100 text-red-800 border-red-200",
  info: "bg-sky-100 text-sky-800 border-sky-200",
};

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children?: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}) {
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

/* ------------------------------- EmptyState --------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-dash-text">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-dash-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------------------------- Toggle ---------------------------------- */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2",
          checked ? "bg-dash-primary" : "bg-dash-border"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-dash-text">{label}</span>}
    </label>
  );
}

/* ------------------------------- ColorInput --------------------------------- */

export function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-dash-border bg-dash-surface p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

/* ------------------------------- RangeInput -------------------------------- */

export function RangeInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-dash-text">{label}</label>
        <span className="text-sm text-dash-muted">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-dash-border accent-dash-primary"
      />
    </div>
  );
}

/* ------------------------------- FormField ---------------------------------- */

export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-dash-muted">{hint}</p>}
    </div>
  );
}

/* -------------------------------- Skeleton ---------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-dash-border",
        className
      )}
    />
  );
}

/* ------------------------------- ErrorState --------------------------------- */

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-dash-danger">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
      </div>
      <p className="text-sm text-dash-text">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/* ----------------------------- LoadingSpinner ------------------------------- */

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-6 w-6 animate-spin text-dash-primary", className)}
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

/* ---------------------------------- Modal ----------------------------------- */

type ModalSize = "sm" | "md" | "lg" | "xl";

const modalSizes: Record<ModalSize, string> = {
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
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: ModalSize;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 mx-4 w-full rounded-lg border border-dash-border bg-dash-surface shadow-xl",
          modalSizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-6 py-4">
            <h2 className="text-lg font-semibold text-dash-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
