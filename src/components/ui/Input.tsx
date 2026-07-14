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
          <label htmlFor={inputId} className="block text-sm font-medium text-dash-text mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-10 px-3 rounded-md border bg-dash-surface text-dash-text text-sm",
            "placeholder:text-dash-muted transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-dash-danger focus:ring-dash-danger"
              : "border-dash-border focus:border-dash-primary focus:ring-dash-primary",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-dash-text mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-3 py-2 rounded-md border bg-dash-surface text-dash-text text-sm",
            "placeholder:text-dash-muted transition-colors min-h-[80px] resize-y",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-dash-danger focus:ring-dash-danger"
              : "border-dash-border focus:border-dash-primary focus:ring-dash-primary",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-dash-text mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full h-10 px-3 rounded-md border bg-dash-surface text-dash-text text-sm",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-dash-danger focus:ring-dash-danger"
              : "border-dash-border focus:border-dash-primary focus:ring-dash-primary",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
