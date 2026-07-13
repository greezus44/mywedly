import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({ variant = "outline", size = "md", className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-ui uppercase tracking-wider-luxe transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const sizes = { sm: "text-xs px-5 py-2.5", md: "text-xs px-7 py-3", lg: "text-sm px-8 py-3.5" };
  const variants = {
    primary: "bg-[var(--color-primary)] text-white border border-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] hover:border-[var(--color-primary-dark)]",
    outline: "bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white",
    ghost: "bg-transparent text-[var(--color-primary)] border border-transparent hover:bg-[var(--color-primary)]/10",
    danger: "bg-transparent text-[var(--color-error)] border border-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white",
  };
  return <button className={cn(base, sizes[size], variants[variant], className)} style={{ borderRadius: "var(--button-radius, 8px)" }} {...props}>{children}</button>;
}
