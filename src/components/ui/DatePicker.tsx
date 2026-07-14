import { useState, useEffect, type ChangeEvent } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
}

export function DatePicker({ label, value, onChange, min, placeholder }: DatePickerProps) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
        )}
      />
      {!value && placeholder && <p className="mt-0.5 text-xs text-dash-muted">{placeholder}</p>}
    </div>
  );
}
