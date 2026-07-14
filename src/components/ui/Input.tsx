import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

const baseFieldClasses =
  "w-full rounded-lg border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 transition-colors";

const labelClasses =
  "block text-sm font-medium text-dash-text mb-1.5";
const errorClasses =
  "block text-xs text-dash-danger mt-1";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseFieldClasses,
            error ? "border-dash-danger" : "border-dash-border",
            className
          )}
          {...props}
        />
        {error && <span className={errorClasses}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            baseFieldClasses,
            "min-h-[80px] resize-y",
            error ? "border-dash-danger" : "border-dash-border",
            className
          )}
          {...props}
        />
        {error && <span className={errorClasses}>{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            baseFieldClasses,
            "cursor-pointer appearance-none bg-no-repeat pr-9",
            error ? "border-dash-danger" : "border-dash-border",
            className
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundPosition: "right 0.5rem center",
            backgroundSize: "1.25rem",
          }}
          {...props}
        >
          {children}
        </select>
        {error && <span className={errorClasses}>{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
