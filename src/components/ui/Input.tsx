import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-sand bg-white px-3 py-2 text-sm text-onyx placeholder:text-sepia/40 outline-none transition-colors focus:border-sepia",
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
        "w-full rounded-md border border-sand bg-white px-3 py-2 text-sm text-onyx placeholder:text-sepia/40 outline-none transition-colors focus:border-sepia resize-y",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={cn("text-xs font-medium uppercase tracking-widest text-sepia mb-1.5 block", className)}>
    {children}
  </label>
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md border border-sand bg-white px-3 py-2 text-sm text-onyx outline-none transition-colors focus:border-sepia",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
