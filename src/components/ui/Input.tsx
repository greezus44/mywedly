import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-y",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white transition-colors focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
