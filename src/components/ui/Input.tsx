import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-onyx placeholder:text-sepia/40 outline-none transition-all focus:border-sepia focus:ring-2 focus:ring-sepia/10", className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn("w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-onyx placeholder:text-sepia/40 outline-none transition-all focus:border-sepia focus:ring-2 focus:ring-sepia/10 resize-y", className)} {...props} />
  )
);
Textarea.displayName = "Textarea";

export const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={cn("text-xs font-medium uppercase tracking-widest text-sepia mb-1.5 block", className)}>{children}</label>
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn("w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-onyx outline-none transition-all focus:border-sepia focus:ring-2 focus:ring-sepia/10", className)} {...props}>{children}</select>
  )
);
Select.displayName = "Select";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", checked ? "bg-onyx" : "bg-sand")}
      >
        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
      {label && <span className="text-sm text-sepia">{label}</span>}
    </div>
  );
}
