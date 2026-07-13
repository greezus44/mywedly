import { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-white border border-gray-200 rounded-xl", className)}>{children}</div>;
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "warning" | "error" | "info" }) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", variants[variant])}>{children}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", checked ? "bg-black" : "bg-gray-200")}
      >
        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono uppercase" />
    </div>
  );
}

export function RangeInput({ value, min, max, step = 1, onChange }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-black" />
      <span className="text-sm text-gray-600 w-12 text-right tabular-nums">{value}</span>
    </div>
  );
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn("relative bg-white rounded-xl border border-gray-200 w-full max-h-[90vh] overflow-y-auto", maxWidth)}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-up">
      <div className={cn("px-4 py-3 rounded-lg text-sm font-medium shadow-lg", type === "success" ? "bg-black text-white" : "bg-red-600 text-white")}>
        {message}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-100 rounded", className)} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <X className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{message}</h3>
      {onRetry && <button onClick={onRetry} className="mt-3 text-sm text-gray-600 hover:text-black underline">Try again</button>}
    </div>
  );
}

export function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste image URL"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
      />
      {value && <img src={value} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200" />}
    </div>
  );
}

export { Select } from "./Input";
