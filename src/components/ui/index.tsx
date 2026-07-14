import { type ReactNode, useEffect } from "react";
import { cn } from "../../lib/utils";

export { Input, Textarea, Select } from "./Input";
export { Button } from "./Button";
export { FontSelect } from "./FontSelect";
export { DatePicker } from "./DatePicker";
export { TimePicker } from "./TimePicker";
export { DateTimePicker } from "./DateTimePicker";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg border border-dash-border bg-dash-surface p-4", className)}>{children}</div>;
}

type BadgeVariant = "default" | "success" | "warning" | "danger";
const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};
export function Badge({ variant = "default", children }: { variant?: BadgeVariant; children: ReactNode }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", badgeVariants[variant])}>{children}</span>;
}

export function EmptyState({ title, description, icon, action }: { title: string; description?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-dash-border bg-dash-bg px-6 py-12 text-center">
      {icon && <div className="mb-3 text-dash-muted">{icon}</div>}
      <h3 className="text-sm font-semibold text-dash-text">{title}</h3>
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
        className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-dash-primary" : "bg-gray-300")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "left-0.5 translate-x-5" : "left-0.5")} />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5" />
      <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-dash-border bg-dash-bg px-2 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
    </div>
  );
}

export function RangeInput({ label, value, onChange, min, max, step }: { label?: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number }) {
  return (
    <div className="w-full">
      {label && <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-dash-muted">{label}</label><span className="text-xs text-dash-muted">{value}</span></div>}
      <input type="range" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step ?? 1} className="w-full accent-dash-primary" />
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
  return <div className={cn("animate-pulse rounded bg-dash-bg", className)} />;
}

export function ErrorState({ title, message, onRetry }: { title: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface px-6 py-12 text-center">
      <svg className="mb-3 h-10 w-10 text-dash-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
      <h3 className="text-sm font-semibold text-dash-text">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-dash-muted">{message}</p>}
      {onRetry && <button onClick={onRetry} className="mt-4 text-sm font-medium text-dash-primary hover:underline">Try again</button>}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <div className={cn("h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent", className)} />;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg border border-dash-border bg-dash-surface shadow-xl">
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-5 py-3">
            <h2 className="text-base font-semibold text-dash-text">{title}</h2>
            <button onClick={onClose} className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto p-5 scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
