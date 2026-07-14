import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface BaseProps {
  label?: string;
  error?: string;
}

const baseField =
  "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted/60 focus:border-dash-primary focus:outline-none focus:ring-2 focus:ring-dash-primary/20 disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & BaseProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
        <input ref={ref} id={inputId} className={cn(baseField, error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger/20", className)} {...props} />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
        <textarea ref={ref} id={inputId} className={cn(baseField, "resize-y", error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger/20", className)} {...props} />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & BaseProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
        <select ref={ref} id={inputId} className={cn(baseField, "cursor-pointer", error && "border-dash-danger", className)} {...props}>
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
