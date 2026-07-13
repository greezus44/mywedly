import { type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm", className)}>{children}</div>;
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "warning" | "error" | "info" }) {
  const variants = { default: "bg-slate-100 text-slate-700", success: "bg-green-100 text-green-700", warning: "bg-amber-100 text-amber-700", error: "bg-red-100 text-red-700", info: "bg-blue-100 text-blue-700" };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant])}>{children}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)} className={cn("relative w-10 h-6 rounded-full transition-colors", checked ? "bg-slate-900" : "bg-slate-200")}>
        <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", checked && "translate-x-4")} />
      </button>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded border border-slate-200 cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200" />
      </div>
    </div>
  );
}

export function RangeInput({ value, onChange, min = 0, max = 100, step = 1, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: string }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}: {value}</label>}
      <input type="range" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} className="w-full" />
    </div>
  );
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div><label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>{children}{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-200 rounded", className)} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-3 text-sm text-slate-700 underline">Try again</button>}
    </div>
  );
}

export { Select } from "./Input";
export { Modal } from "./DatePicker";

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={cn("flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg", type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white")}>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
