import {
  type ReactNode,
  useEffect,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Select } from "./Input";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-gray-200 bg-white", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-gray-300">{icon}</div>}
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Toggle({ checked, onChange, label, className }: ToggleProps) {
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-gray-900" : "bg-gray-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// ColorInput
// ---------------------------------------------------------------------------

export interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function ColorInput({ value, onChange, label, className }: ColorInputProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-gray-200 p-0.5"
        />
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-900 focus:border-gray-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RangeInput
// ---------------------------------------------------------------------------

export interface RangeInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export function RangeInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  className,
}: RangeInputProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600">{label}</label>
          <span className="text-xs text-gray-400">{value}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-gray-900"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------

export interface FormFieldProps {
  label?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />
  );
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <AlertCircle className="h-8 w-8 text-red-400" />
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Something went wrong</h3>
        {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md bg-gray-900 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white hover:bg-gray-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  duration?: number;
}

const toastTypeClasses: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

export function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-fade-in-up",
        toastTypeClasses[type],
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal (placeholder re-export — DatePicker will provide the real one)
// ---------------------------------------------------------------------------

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight modal. Re-exported here so consumers can import from `ui`.
 * The DatePicker component (created separately) may provide its own Modal.
 */
export function Modal({ open, onClose, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted && !open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        open ? "animate-fade-in" : "animate-fade-in pointer-events-none opacity-0",
      )}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { Select } from "./Input";
export type { SelectProps } from "./Input";
export { TimePicker } from "./TimePicker";
export { DatePicker } from "./DatePicker";
export { DateTimePicker } from "./DateTimePicker";
