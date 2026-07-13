import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const baseFieldClasses =
  "w-full rounded-md border bg-dash-surface px-3 py-2 text-sm text-dash-text placeholder:text-dash-muted transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50";

const errorBorderClass = "border-dash-danger";
const normalBorderClass = "border-dash-border";

/* ----------------------------------- Input ----------------------------------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseFieldClasses, error ? errorBorderClass : normalBorderClass, className)}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

/* --------------------------------- Textarea ---------------------------------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(baseFieldClasses, "min-h-[80px] resize-y", error ? errorBorderClass : normalBorderClass, className)}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* ---------------------------------- Select ----------------------------------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-dash-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(baseFieldClasses, "cursor-pointer", error ? errorBorderClass : normalBorderClass, className)}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
