import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("bg-dash-surface border border-dash-border rounded-xl", className)}>{children}</div>;
}

export function Badge({ variant = "default", children }: { variant?: "default" | "success" | "warning" | "danger" | "info"; children?: React.ReactNode }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant])}>{children}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-dash-muted">{icon}</div>}
      <h3 className="text-lg font-medium text-dash-text mb-1">{title}</h3>
      {description && <p className="text-sm text-dash-muted max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)} className={cn("relative w-11 h-6 rounded-full transition-colors", checked ? "bg-dash-primary" : "bg-slate-300")}>
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform", checked && "translate-x-5")} />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-dash-border" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-dash-border bg-white text-dash-text text-sm" />
      </div>
    </div>
  );
}

export function RangeInput({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dash-text mb-1">{label}: {value}px</label>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

export function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-dash-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 rounded", className)} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-red-600 mb-3">{message}</p>
      {onRetry && <button onClick={onRetry} className="text-sm text-dash-primary hover:underline">Try again</button>}
    </div>
  );
}

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return <Loader2 className="animate-spin text-dash-primary" style={{ width: size, height: size }} />;
}

export function Modal({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className={cn("w-full bg-dash-surface rounded-xl shadow-xl max-h-[90vh] overflow-y-auto", sizes[size])} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-dash-border">
          <h2 className="text-lg font-semibold text-dash-text">{title}</h2>
          <button onClick={onClose} className="text-dash-muted hover:text-dash-text text-xl">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export { Input, Textarea, Select } from "./Input";
export { TimePicker } from "./TimePicker";
export { DatePicker } from "./DatePicker";
export { DateTimePicker } from "./DateTimePicker";
