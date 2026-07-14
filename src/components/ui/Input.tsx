import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

const baseField =
  "w-full rounded-md border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary disabled:opacity-50 disabled:cursor-not-allowed";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseField, error ? "border-dash-danger" : "border-dash-border", className)}
          {...rest}
        />
        {error && <p className="text-sm text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(baseField, "min-h-[80px] resize-y", error ? "border-dash-danger" : "border-dash-border", className)}
          {...rest}
        />
        {error && <p className="text-sm text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(baseField, "cursor-pointer", error ? "border-dash-danger" : "border-dash-border", className)}
          {...rest}
        >
          {children}
        </select>
        {error && <p className="text-sm text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
