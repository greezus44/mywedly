import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const baseFieldClasses =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(baseFieldClasses, className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(baseFieldClasses, "min-h-[80px] resize-y", className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(baseFieldClasses, "cursor-pointer pr-8", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
