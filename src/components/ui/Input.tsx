import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const baseField =
  "w-full rounded-lg border bg-dash-surface px-3 py-2 text-dash-text placeholder:text-dash-muted/60 focus:outline-none focus:ring-2 focus:ring-dash-primary/30 disabled:opacity-50";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function FieldWrapper({ label, error, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      {children}
      {error && <p className="text-sm text-dash-danger">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error}>
        <input
          ref={ref}
          className={cn(baseField, error ? "border-dash-danger" : "border-dash-border", className)}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error}>
        <textarea
          ref={ref}
          className={cn(baseField, "resize-y min-h-[80px]", error ? "border-dash-danger" : "border-dash-border", className)}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <FieldWrapper label={label} error={error}>
        <select
          ref={ref}
          className={cn(baseField, "cursor-pointer", error ? "border-dash-danger" : "border-dash-border", className)}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    );
  },
);
Select.displayName = "Select";
