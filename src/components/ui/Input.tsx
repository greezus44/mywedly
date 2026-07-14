import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const baseField = "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <input ref={ref} id={id} className={cn(baseField, error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger", className)} {...props} />
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <textarea ref={ref} id={id} className={cn(baseField, "resize-y", error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger", className)} {...props} />
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <select ref={ref} id={id} className={cn(baseField, "cursor-pointer", error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger", className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
