import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

const baseFieldClasses =
  "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

function FieldWrapper({ label, error, children, className }: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-sm font-medium text-dash-text">{label}</label>
      )}
      {children}
      {error && <p className="text-xs text-dash-danger">{error}</p>}
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
        <input ref={ref} className={cn(baseFieldClasses, className)} {...props} />
      </FieldWrapper>
    );
  }
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
        <textarea ref={ref} className={cn(baseFieldClasses, "min-h-[80px] resize-y", className)} {...props} />
      </FieldWrapper>
    );
  }
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
        <select ref={ref} className={cn(baseFieldClasses, "cursor-pointer", className)} {...props}>
          {children}
        </select>
      </FieldWrapper>
    );
  }
);
Select.displayName = "Select";
