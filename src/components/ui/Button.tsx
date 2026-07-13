import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; loading?: boolean; }
const variants: Record<Variant, string> = {
  primary: "bg-onyx text-cream hover:bg-onyx-light",
  secondary: "bg-cream-light text-onyx hover:bg-cream border border-onyx/15",
  ghost: "text-onyx hover:bg-onyx/5",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
const sizes: Record<Size, string> = { sm: "px-4 py-2 text-xs tracking-wide", md: "px-6 py-2.5 text-sm tracking-wide", lg: "px-8 py-3 text-sm tracking-wide" };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = "primary", size = "md", loading = false, className, children, disabled, ...props }, ref) => (
  <button ref={ref} className={cn("inline-flex items-center justify-center gap-2 font-medium uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed", variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}{children}
  </button>
));
Button.displayName = "Button";
