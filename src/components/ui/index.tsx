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

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-dash-border bg-dash-surface shadow-sm", className)}
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
  variant?: "default" | "primary" | "success" | "danger" | "warning";
}) {
  const variants: Record<string, string> = {
    default: "bg-dash-bg text-dash-muted border-dash-border",
    primary: "bg-dash-primary/10 text-dash-primary border-dash-primary/20",
    success: "bg-green-100 text-green-700 border-green-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-dash-muted max-w-sm">{description}</p>}
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
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", disabled && "opacity-50 cursor-not-allowed", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary/30",
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
    <div className={cn("space-y-1", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-dash-border bg-dash-surface cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-dash-border bg-dash-surface px-2 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
        />
      </div>
    </div>
  );
}

export function RangeInput({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-dash-text">{label}</label>
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
        className="w-full accent-dash-primary"
      />
    </div>
  );
}

export function FormField({
  label,
  error,
  children,
  className,
}: {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      {children}
      {error && <p className="text-sm text-dash-danger">{error}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-dash-border/50", className)} />;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="mb-4 text-dash-danger">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-dash-muted max-w-sm">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 animate-fadeIn" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full rounded-lg border border-dash-border bg-dash-surface shadow-xl animate-scaleIn",
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-base font-semibold text-dash-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-dash-muted hover:text-dash-text rounded p-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
