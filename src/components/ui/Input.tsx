import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface BaseFieldProps {
  label?: string;
  error?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, BaseFieldProps {}

const fieldBaseClasses =
  "w-full rounded-lg border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 transition-colors";

const errorBorderClass = (error?: string) =>
  error ? "border-dash-danger" : "border-dash-border";

const labelClass = "block text-sm font-medium text-dash-text mb-1.5";
const errorClass = "mt-1 text-xs text-dash-danger";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClass}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldBaseClasses, errorBorderClass(error), className)}
          {...props}
        />
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClass}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(fieldBaseClasses, "resize-y min-h-[80px]", errorBorderClass(error), className)}
          {...props}
        />
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClass}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(fieldBaseClasses, "cursor-pointer", errorBorderClass(error), className)}
          {...props}
        >
          {children}
        </select>
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
