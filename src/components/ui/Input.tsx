import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const labelClass = "block text-sm font-medium text-dash-text mb-1";
const errorClass = "mt-1 text-xs text-red-500";
const baseInput =
  "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-dash-primary/50 focus:border-dash-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className={labelClass}>{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseInput, error && "border-red-400 focus:ring-red-400/50", className)}
          {...props}
        />
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className={labelClass}>{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(baseInput, "resize-y min-h-[80px]", error && "border-red-400 focus:ring-red-400/50", className)}
          {...props}
        />
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className={labelClass}>{label}</label>}
        <select
          ref={ref}
          id={inputId}
          className={cn(baseInput, "appearance-none cursor-pointer", error && "border-red-400 focus:ring-red-400/50", className)}
          {...props}
        >
          {children}
        </select>
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
