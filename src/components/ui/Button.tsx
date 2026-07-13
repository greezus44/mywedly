import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-onyx text-parchment hover:bg-ink shadow-sm",
  secondary: "bg-mist text-sepia hover:bg-sand/50 shadow-sm",
  outline: "border border-sand text-sepia hover:bg-mist shadow-sm",
  ghost: "text-sepia hover:bg-mist",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-sm rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={cn("inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)} {...props} />
  )
);
Button.displayName = "Button";
