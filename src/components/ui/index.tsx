import React from "react";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select } from "./Input";
import { Button } from "./Button";
import { TimePicker } from "./TimePicker";
import { DatePicker } from "./DatePicker";
import { DateTimePicker } from "./DateTimePicker";

export { Input, Textarea, Select, TimePicker, DatePicker, DateTimePicker, Button };

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ className, children, color = "default" }: { className?: string; children: React.ReactNode; color?: "default" | "primary" | "success" | "danger" | "warning" }) {
  const colorClasses: Record<string, string> = {
    default: "bg-dash-bg text-dash-muted border-dash-border",
    primary: "bg-dash-primary/10 text-dash-primary border-dash-primary/20",
    success: "bg-green-50 text-green-700 border-green-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", colorClasses[color], className)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dash-border bg-dash-surface px-6 py-12 text-center">
      {icon && <div className="mb-4 text-dash-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-dash-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, className }: { checked: boolean; onChange: (checked: boolean) => void; label?: string; className?: string }) {
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/20",
          checked ? "bg-dash-primary" : "bg-dash-border",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-dash-text">{label}</span>}
    </label>
  );
}

export function ColorInput({ label, value, onChange }: { label?: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-dash-border bg-dash-surface p-1"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/20"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function RangeInput({ label, value, onChange, min = 0, max = 100, step = 1 }: { label?: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-dash-text">{label}</label>
          <span className="text-sm text-dash-muted">{value}{label?.includes("px") ? "px" : ""}</span>
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

export function FormField({ label, error, children, hint }: { label?: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      {children}
      {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-sm text-dash-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-dash-border/50", className)} />;
}

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dash-border bg-dash-surface px-6 py-12 text-center">
      <div className="mb-4 text-3xl">⚠️</div>
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-dash-muted">{message}</p>}
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
    <svg
      className={cn("h-5 w-5 animate-spin text-dash-primary", className)}
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
  );
}

export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string }) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-lg rounded-xl border border-dash-border bg-dash-surface p-6 shadow-xl", className)}>
        {title && <h2 className="mb-4 text-lg font-semibold text-dash-text">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
