import { type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-[var(--color-surface)] border border-[var(--color-border)]", className)} style={{ borderRadius: "var(--radius)" }}>{children}</div>;
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "warning" | "error" | "info" }) {
  const variants = { default: "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]", success: "bg-green-50 text-green-700", warning: "bg-amber-50 text-amber-700", error: "bg-red-50 text-red-700", info: "bg-blue-50 text-blue-700" };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider", variants[variant])}>{children}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center py-20 text-center">{icon && <div className="mb-4 text-[var(--color-text-muted)] opacity-30">{icon}</div>}<h3 className="text-lg font-heading text-[var(--color-text)]">{title}</h3>{description && <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>}{action && <div className="mt-6">{action}</div>}</div>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <label className="flex items-center gap-2 cursor-pointer"><button type="button" onClick={() => onChange(!checked)} className={cn("relative w-10 h-6 transition-colors", checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]")} style={{ borderRadius: "var(--radius)" }}><span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white shadow transition-transform", checked && "translate-x-4")} /></button>{label && <span className="text-sm text-[var(--color-text)]">{label}</span>}</label>;
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return <div>{label && <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">{label}</label>}<div className="flex items-center gap-2"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 border border-[var(--color-border)] cursor-pointer" style={{ borderRadius: "var(--radius)" }} /><input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-surface)]" style={{ borderRadius: "var(--radius)" }} /></div></div>;
}

export function RangeInput({ value, onChange, min = 0, max = 100, step = 1, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }) {
  return <div>{label && <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">{label}: {value}</label>}<input type="range" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} className="w-full" /></div>;
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div><label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">{label}</label>{children}{hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}</div>;
}

export function Skeleton({ className }: { className?: string }) { return <div className={cn("animate-pulse bg-[var(--color-bg-subtle)]", className)} />; }

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="text-sm text-red-600">{message}</p>{onRetry && <button onClick={onRetry} className="mt-3 text-sm text-[var(--color-text)] underline">Try again</button>}</div>;
}

export { Select } from "./Input";
export { Modal } from "./DatePicker";

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  return <div className="fixed bottom-6 right-6 z-50 animate-slide-up"><div className={cn("flex items-center gap-3 px-4 py-3 shadow-lg", type === "success" ? "bg-[var(--color-primary)] text-[var(--color-bg)]" : "bg-red-600 text-white")} style={{ borderRadius: "var(--radius)" }}><span className="text-sm">{message}</span><button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button></div></div>;
}
