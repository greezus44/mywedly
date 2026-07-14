import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface BaseProps {
  label?: string;
  error?: string;
}

const baseInputClasses =
  "w-full rounded-md border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 focus:border-dash-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

function wrapLabel(label: string | undefined, error: string | undefined, id: string | undefined, children: React.ReactNode) {
  if (!label && !error) return children;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-dash-danger">{error}</p>}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, BaseProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    const input = (
      <input
        ref={ref}
        id={inputId}
        className={cn(
          baseInputClasses,
          error ? "border-dash-danger" : "border-dash-border",
          className,
        )}
        {...props}
      />
    );
    return wrapLabel(label, error, inputId, input);
  },
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, BaseProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    const textarea = (
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          baseInputClasses,
          "resize-y min-h-[80px]",
          error ? "border-dash-danger" : "border-dash-border",
          className,
        )}
        {...props}
      />
    );
    return wrapLabel(label, error, inputId, textarea);
  },
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, BaseProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    const select = (
      <select
        ref={ref}
        id={inputId}
        className={cn(
          baseInputClasses,
          "cursor-pointer",
          error ? "border-dash-danger" : "border-dash-border",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
    return wrapLabel(label, error, inputId, select);
  },
);
Select.displayName = "Select";
