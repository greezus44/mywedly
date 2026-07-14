import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface BaseProps {
  label?: string;
  error?: string;
}

interface InputProps
  extends BaseProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {}

interface TextareaProps
  extends BaseProps,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

interface SelectProps
  extends BaseProps,
    React.SelectHTMLAttributes<HTMLSelectElement> {}

const baseInputClasses =
  "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const errorClasses = "border-dash-danger focus:ring-dash-danger";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name || label;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dash-text mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseInputClasses, error && errorClasses, className)}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name || label;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dash-text mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(baseInputClasses, "resize-y min-h-[80px]", error && errorClasses, className)}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const inputId = id || props.name || label;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dash-text mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(baseInputClasses, "appearance-none cursor-pointer", error && errorClasses, className)}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
