import { type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select } from "./Input";
import { Button } from "./Button";
import { FontSelect } from "./FontSelect";
import { TimePicker } from "./TimePicker";
import { DatePicker } from "./DatePicker";
import { DateTimePicker } from "./DateTimePicker";

export { Input, Textarea, Select, Button, FontSelect, TimePicker, DatePicker, DateTimePicker };

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-dash-border bg-dash-surface p-4", className)}>{children}</div>;
}

type BadgeVariant = "default" | "success" | "warning" | "danger";

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-dash-bg text-dash-muted",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant])}>{children}</span>;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface px-6 py-12 text-center">
      {icon && <div className="mb-3 text-dash-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-dash-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", checked ? "bg-dash-primary" : "bg-dash-border")}
      >
        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

export function ColorInput({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
      </div>
    </div>
  );
}

export function RangeInput({ label, value, min, max, step = 1, onChange, unit }: { label?: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-dash-text">{label}</label>
          <span className="text-sm text-dash-muted">{value}{unit}</span>
        </div>
      )}
      <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-dash-primary" />
    </div>
  );
}

export function FormField({ label, error, children }: { label?: string; error?: string; children: ReactNode }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      {children}
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-dash-bg", className)} />;
}

interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-dash-text">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-dash-muted">{message}</p>}
      {onRetry && <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-8 w-8 animate-spin text-dash-primary", className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-dash-border bg-dash-surface shadow-2xl">
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-base font-semibold text-dash-text">{title}</h2>
            <button onClick={onClose} className="text-dash-muted hover:text-dash-text" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="max-h-[80vh] overflow-y-auto p-5 scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
