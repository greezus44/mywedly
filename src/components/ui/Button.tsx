import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
      primary: "bg-[var(--event-primary,#8B7355)] text-white hover:bg-[var(--event-primary-hover,#75604A)]",
      secondary: "bg-[var(--event-secondary,#D4C5B0)] text-[var(--event-text,#2D2D2D)] hover:bg-[var(--event-secondary-hover,#C4B5A0)]",
      outline: "border border-[var(--event-border,#E5E0D8)] text-[var(--event-text,#2D2D2D)] hover:bg-gray-50",
      ghost: "text-[var(--event-text,#2D2D2D)] hover:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700",
    };
    const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  },
);
Button.displayName = "Button";
