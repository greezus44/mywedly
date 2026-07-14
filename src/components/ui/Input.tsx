import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

const baseField =
  "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name || React.useId();
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseField, error && "border-dash-danger focus:ring-dash-danger/40", className)}
          {...props}
        />
        {error && <span className="text-xs text-dash-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name || React.useId();
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(baseField, "min-h-[80px] resize-y", error && "border-dash-danger focus:ring-dash-danger/40", className)}
          {...props}
        />
        {error && <span className="text-xs text-dash-danger">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id || props.name || React.useId();
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(baseField, "cursor-pointer", error && "border-dash-danger focus:ring-dash-danger/40", className)}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-dash-danger">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
