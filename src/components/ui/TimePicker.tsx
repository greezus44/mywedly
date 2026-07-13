import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  interval?: number;
  use24Hour?: boolean;
}

export function TimePicker({ value, onChange, label, placeholder = "Select time", interval = 15, use24Hour = false }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => { if (open && listRef.current && value) { listRef.current.querySelector(`[data-time="${value}"]`)?.scrollIntoView({ block: "center" }); } }, [open, value]);

  const times: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      const v = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      if (use24Hour) times.push({ value: v, label: v });
      else { const p = h >= 12 ? "PM" : "AM"; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; times.push({ value: v, label: `${h12}:${m.toString().padStart(2, "0")} ${p}` }); }
    }
  }

  const formatDisplay = (val: string | null) => {
    if (!val) return placeholder;
    if (use24Hour) return val;
    const [h, m] = val.split(":").map(Number);
    const p = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${p}`;
  };

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:border-gray-900">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className={cn(!value && "text-gray-400")}>{formatDisplay(value)}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-40">
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {times.map(t => <button key={t.value} type="button" data-time={t.value} onClick={() => { onChange(t.value); setOpen(false); }} className={cn("w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-100", value === t.value && "bg-gray-900 text-white hover:bg-gray-900")}>{t.label}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}
