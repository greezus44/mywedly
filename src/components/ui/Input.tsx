import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const baseFieldClasses =
  "w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text placeholder:text-dash-muted transition-colors focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary disabled:cursor-not-allowed disabled:opacity-50";

const labelClasses = "mb-1.5 block text-sm font-medium text-dash-text";
const errorClasses = "mt-1 text-xs text-dash-danger";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
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
          className={cn(baseFieldClasses, "h-10", error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger", className)}
          {...props}
        />
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className={labelClasses}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(baseFieldClasses, "min-h-[80px] py-2", error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger", className)}
          {...props}
        />
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className={labelClasses}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(baseFieldClasses, "h-10", error && "border-dash-danger focus:border-dash-danger focus:ring-dash-danger", className)}
          {...props}
        >
          {children}
        </select>
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
