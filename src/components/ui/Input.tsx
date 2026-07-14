import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

const baseInputClass =
  "w-full rounded-lg border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary/30 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseInputClass,
            error ? "border-dash-danger focus:ring-dash-danger/30" : "border-dash-border focus:border-dash-primary",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            baseInputClass,
            "resize-y min-h-[80px]",
            error ? "border-dash-danger focus:ring-dash-danger/30" : "border-dash-border focus:border-dash-primary",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            baseInputClass,
            "cursor-pointer appearance-none bg-no-repeat",
            error ? "border-dash-danger focus:ring-dash-danger/30" : "border-dash-border focus:border-dash-primary",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
