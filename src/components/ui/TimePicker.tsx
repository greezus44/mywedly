import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
}

export function TimePicker({ value, onChange, label, placeholder = "Select time" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  const formatTime = (h: number, m: number, ampm: string) => {
    const hour24 = ampm === "PM" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const displayValue = value
    ? (() => {
        const [h, m] = value.split(":").map(Number);
        return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
      })()
    : "";

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
        style={{ borderRadius: "var(--radius)" }}
      >
        <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
        <span className={cn(!displayValue && "text-[var(--color-text-muted)]")}>{displayValue || placeholder}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg p-3 w-64" style={{ borderRadius: "var(--radius)" }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Hour</div>
              <div className="grid grid-cols-4 gap-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      const m = value ? parseInt(value.split(":")[1]) : 0;
                      const ampm = value ? (parseInt(value.split(":")[0]) >= 12 ? "PM" : "AM") : "AM";
                      onChange(formatTime(h, m, ampm));
                    }}
                    className="px-2 py-1 text-xs hover:bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-1">Minute</div>
              <div className="grid grid-cols-4 gap-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      const h = value ? parseInt(value.split(":")[0]) % 12 || 12 : 12;
                      const ampm = value ? (parseInt(value.split(":")[0]) >= 12 ? "PM" : "AM") : "AM";
                      onChange(formatTime(h, m, ampm));
                    }}
                    className="px-2 py-1 text-xs hover:bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {["AM", "PM"].map((ampm) => (
              <button
                key={ampm}
                type="button"
                onClick={() => {
                  if (!value) onChange(formatTime(12, 0, ampm));
                  else {
                    const h = parseInt(value.split(":")[0]) % 12 || 12;
                    const m = parseInt(value.split(":")[1]);
                    onChange(formatTime(h, m, ampm));
                  }
                }}
                className="flex-1 px-2 py-1 text-xs border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]"
              >
                {ampm}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
