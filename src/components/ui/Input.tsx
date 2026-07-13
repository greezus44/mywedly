import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("w-full px-4 py-2.5 text-sm bg-white border border-onyx/15 text-onyx placeholder:text-onyx/30 focus:outline-none focus:border-onyx/40 transition-colors", className)} {...props} />);
Input.displayName = "Input";
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => <textarea ref={ref} className={cn("w-full px-4 py-2.5 text-sm bg-white border border-onyx/15 text-onyx placeholder:text-onyx/30 focus:outline-none focus:border-onyx/40 transition-colors resize-y min-h-[80px]", className)} {...props} />);
Textarea.displayName = "Textarea";
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => <select ref={ref} className={cn("w-full px-4 py-2.5 text-sm bg-white border border-onyx/15 text-onyx focus:outline-none focus:border-onyx/40 transition-colors", className)} {...props}>{children}</select>);
Select.displayName = "Select";
