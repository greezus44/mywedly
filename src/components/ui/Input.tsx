import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

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
            "w-full rounded-lg border bg-dash-surface px-3 py-2 text-sm text-dash-text shadow-sm transition-colors placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-dash-danger" : "border-dash-border",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
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
            "w-full rounded-lg border bg-dash-surface px-3 py-2 text-sm text-dash-text shadow-sm transition-colors placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-dash-danger" : "border-dash-border",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
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
            "w-full rounded-lg border bg-dash-surface px-3 py-2 text-sm text-dash-text shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-dash-danger" : "border-dash-border",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
