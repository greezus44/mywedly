import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select } from "./Input";
import { Button } from "./Button";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { DateTimePicker } from "./DateTimePicker";
import { FontSelect } from "./FontSelect";

// Re-exports
export { Input, Textarea, Select, Button, DatePicker, TimePicker, DateTimePicker, FontSelect };

// ---------- Card ----------
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}
export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dash-border bg-dash-surface p-4 shadow-sm",
        hover && "transition-shadow hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ---------- Badge ----------
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}
export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-dash-bg text-dash-text border-dash-border",
    primary: "bg-dash-primary/10 text-dash-primary border-dash-primary/20",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ---------- EmptyState ----------
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="mb-3 text-dash-muted">{icon}</div>}
      <h3 className="text-sm font-semibold text-dash-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-dash-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- ErrorState ----------
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}
export function ErrorState({ title = "Something went wrong", message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-3 text-dash-danger">
        <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-dash-text">{title}</h3>
      {message && <p className="mt-1 text-sm text-dash-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ---------- Toggle ----------
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}
export function Toggle({ checked, onChange, label, className, disabled }: ToggleProps) {
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2 disabled:opacity-50",
          checked ? "bg-dash-primary" : "bg-dash-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
      {label && <span className="text-sm text-dash-text">{label}</span>}
    </label>
  );
}

// ---------- ColorInput ----------
export interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}
export function ColorInput({ value, onChange, label, className }: ColorInputProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-dash-text">{label}</span>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ---------- RangeInput ----------
export interface RangeInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}
export function RangeInput({ value, onChange, min = 0, max = 100, step = 1, label, unit, className }: RangeInputProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-dash-text">{label}</span>
          <span className="text-sm text-dash-muted">{value}{unit}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-dash-primary"
      />
    </div>
  );
}

// ---------- FormField ----------
export interface FormFieldProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}
export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      {children}
      {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
    </div>
  );
}

// ---------- Skeleton ----------
export interface SkeletonProps {
  className?: string;
}
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded bg-dash-border/50", className)} />;
}

// ---------- LoadingSpinner ----------
export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  return (
    <svg
      className={cn("animate-spin text-dash-primary", sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ---------- Modal ----------
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}
export function Modal({ open, onClose, title, children, className, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cn(
          "relative w-full rounded-lg border border-dash-border bg-dash-surface shadow-xl",
          sizes[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-dash-border px-4 py-3">
            <h2 className="text-sm font-semibold text-dash-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-dash-muted hover:bg-dash-bg hover:text-dash-text"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
