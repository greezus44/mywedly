import { useState, useEffect, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { Input as InputComp, Textarea as TextareaComp, Select as SelectComp } from "./Input";
import { Button } from "./Button";
import { FontSelect } from "./FontSelect";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { DateTimePicker } from "./DateTimePicker";

export { InputComp as Input, TextareaComp as Textarea, SelectComp as Select };
export { Button };
export { FontSelect };
export { DatePicker };
export { TimePicker };
export { DateTimePicker };

// Card
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-dash-border bg-dash-surface p-4", className)}>{children}</div>;
}

// Badge
type BadgeVariant = "default" | "success" | "warning" | "danger";
const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};
export function Badge({ children, variant = "default", className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", badgeVariants[variant], className)}>{children}</span>;
}

// EmptyState
export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface px-6 py-12 text-center">
      {icon && <div className="mb-3 text-dash-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-dash-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Toggle
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-dash-primary" : "bg-gray-300")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "left-[22px]" : "left-0.5")} />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

// ColorInput
export function ColorInput({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-1" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30" />
      </div>
    </div>
  );
}

// RangeInput
export function RangeInput({ label, value, min = 0, max = 100, step = 1, onChange }: { label?: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-dash-text">{label}</label>
          <span className="text-sm text-dash-muted">{value}</span>
        </div>
      )}
      <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-dash-primary" />
    </div>
  );
}

// FormField
export function FormField({ label, error, children, className }: { label?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      {children}
      {error && <p className="text-sm text-dash-danger">{error}</p>}
    </div>
  );
}

// Skeleton
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-dash-border/40", className)} />;
}

// ErrorState
export function ErrorState({ title, message, onRetry }: { title: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {message && <p className="mt-1 text-sm text-dash-muted">{message}</p>}
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

// LoadingSpinner
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent", className)} />
  );
}

// Modal
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-dash-border bg-dash-surface shadow-xl animate-slideUp">
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-base font-semibold text-dash-text">{title}</h2>
            <button onClick={onClose} className="text-dash-muted hover:text-dash-text" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
