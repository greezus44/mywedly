import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

interface BaseFieldProps {
  label?: string;
  error?: string;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {}

const fieldBase =
  "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted/60 focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary disabled:cursor-not-allowed disabled:opacity-50";

function Label({ label, htmlFor }: { label?: string; htmlFor?: string }) {
  if (!label) return null;
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-dash-text"
    >
      {label}
    </label>
  );
}

function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-sm text-dash-danger">{error}</p>;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        <Label label={label} htmlFor={inputId} />
        <input
          ref={ref}
          id={inputId}
          className={cn(fieldBase, error && "border-dash-danger focus:ring-dash-danger", className)}
          {...props}
        />
        <ErrorText error={error} />
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        <Label label={label} htmlFor={inputId} />
        <textarea
          ref={ref}
          id={inputId}
          className={cn(fieldBase, "resize-y min-h-[80px]", error && "border-dash-danger focus:ring-dash-danger", className)}
          {...props}
        />
        <ErrorText error={error} />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        <Label label={label} htmlFor={inputId} />
        <select
          ref={ref}
          id={inputId}
          className={cn(fieldBase, "cursor-pointer", error && "border-dash-danger focus:ring-dash-danger", className)}
          {...props}
        >
          {children}
        </select>
        <ErrorText error={error} />
      </div>
    );
  }
);
Select.displayName = "Select";
