import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

const baseField =
  "w-full rounded-md border bg-dash-surface text-dash-text placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 focus:border-dash-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const errorField = "border-dash-danger focus:ring-dash-danger/30 focus:border-dash-danger";
const normalField = "border-dash-border";

interface LabelWrapperProps {
  label?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

function LabelWrapper({ label, error, className, children }: LabelWrapperProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text">{label}</label>
      )}
      {children}
      {error && <p className="text-sm text-dash-danger">{error}</p>}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <LabelWrapper label={label} error={error}>
        <input
          ref={ref}
          className={cn(baseField, "px-3 py-2 text-sm", error ? errorField : normalField, className)}
          {...props}
        />
      </LabelWrapper>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <LabelWrapper label={label} error={error}>
        <textarea
          ref={ref}
          className={cn(baseField, "px-3 py-2 text-sm resize-y min-h-[80px]", error ? errorField : normalField, className)}
          {...props}
        />
      </LabelWrapper>
    );
  }
);
Textarea.displayName = "Textarea";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <LabelWrapper label={label} error={error}>
        <select
          ref={ref}
          className={cn(baseField, "px-3 py-2 text-sm", error ? errorField : normalField, className)}
          {...props}
        >
          {children}
        </select>
      </LabelWrapper>
    );
  }
);
Select.displayName = "Select";
