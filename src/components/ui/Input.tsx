import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)]/30 text-[var(--color-text)] font-ui text-sm rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)]/30 text-[var(--color-text)] font-ui text-sm rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-y min-h-[120px]", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Label = ({ children, className }: { children: ReactNode; className?: string }) => (
  <label className={cn("block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-2", className)}>{children}</label>
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn("w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)]/30 text-[var(--color-text)] font-ui text-sm rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all cursor-pointer", className)} {...props}>{children}</select>
));
Select.displayName = "Select";

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <label className="inline-flex items-center gap-3 cursor-pointer">
    <button type="button" onClick={() => onChange(!checked)} className={cn("relative w-11 h-6 rounded-full transition-colors", checked ? "bg-[var(--color-primary)]" : "bg-gray-300")}>
      <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform", checked && "translate-x-5")} />
    </button>
    {label && <span className="font-ui text-sm text-[var(--color-text)]">{label}</span>}
  </label>
);
