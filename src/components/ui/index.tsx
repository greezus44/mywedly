import { useEffect, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { Input, Textarea, Select } from "./Input";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { DateTimePicker } from "./DateTimePicker";

export { Button };
export { Input, Textarea, Select };
export { DatePicker };
export { TimePicker };
export { DateTimePicker };

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm", className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ className, children, variant = "default" }: { className?: string; children: ReactNode; variant?: "default" | "success" | "warning" | "danger" | "primary" }) {
  const variants: Record<string, string> = {
    default: "bg-dash-bg text-dash-muted border-dash-border",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    primary: "bg-sky-50 text-sky-700 border-sky-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-dash-border p-12 text-center">
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-lg font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-dash-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className={cn("inline-flex items-center gap-2", disabled && "opacity-50 cursor-not-allowed")}>
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
        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
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
          className="w-32 rounded-md border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
        />
      </div>
    </div>
  );
}

export function RangeInput({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label?: string }) {
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dash-text">{label}</label>
          <span className="text-sm text-dash-muted">{value}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-dash-primary"
      />
    </div>
  );
}

export function FormField({ label, error, required, children }: { label?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-dash-text">
          {label}
          {required && <span className="text-dash-danger"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-dash-danger">{error}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-dash-border", className)} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface p-8 text-center">
      <svg className="mb-3 h-10 w-10 text-dash-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p className="text-sm text-dash-text">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin h-5 w-5 text-dash-primary", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; className?: string }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-lg rounded-lg border border-dash-border bg-dash-surface shadow-xl", className)}>
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-lg font-semibold text-dash-text">{title}</h2>
            <button type="button" onClick={onClose} className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text" aria-label="Close">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
