import { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", className)}>{children}</div>;
}

export function Badge({ className, children, color = "gray" }: { className?: string; children: ReactNode; color?: "gray" | "green" | "red" | "yellow" | "blue" }) {
  const colors = { gray: "bg-gray-100 text-gray-700", green: "bg-green-100 text-green-700", red: "bg-red-100 text-red-700", yellow: "bg-yellow-100 text-yellow-700", blue: "bg-blue-100 text-blue-700" };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", colors[color], className)}>{children}</span>;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center cursor-pointer gap-2">
      <button type="button" onClick={() => onChange(!checked)} className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", checked ? "bg-gray-900" : "bg-gray-300")}>
        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono uppercase" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

export function RangeInput({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-sm text-gray-600"><span>{label}</span><span className="font-mono">{value}</span></div>}
      <input type="range" value={value} min={min} max={max} step={step || 1} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-gray-900" />
    </div>
  );
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className={cn("w-full bg-white rounded-xl shadow-xl max-h-[90vh] overflow-auto", sizes[size])} onClick={(e) => e.stopPropagation()}>
        {title && <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">{title}</h2></div>}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error" | "info"; onClose: () => void }) {
  const colors = { success: "bg-green-600", error: "bg-red-600", info: "bg-gray-900" };
  return (
    <div className={cn("fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg animate-slide-up", colors[type])}>
      {message}<button onClick={onClose} className="ml-3 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) { return <div className={cn("skeleton rounded-lg", className)} />; }

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 text-red-300"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Something went wrong</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {onRetry && <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Try again</button>}
    </div>
  );
}

export function ImageUpload({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      {value && <img src={value} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-gray-200" />}
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste image URL" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
      <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => onChange(reader.result as string); reader.readAsDataURL(file); }} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
    </div>
  );
}

export { Select } from "./Input";
