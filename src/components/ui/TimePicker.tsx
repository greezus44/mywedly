import { useState, useRef, useEffect, useCallback } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn, formatTime } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  interval?: 5 | 10 | 15;
  use24Hour?: boolean;
}

function generateTimes(interval: number, use24Hour: boolean): { value: string; label: string }[] {
  const times: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += interval) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const label = use24Hour ? value : formatTime(value);
      times.push({ value, label });
    }
  }
  return times;
}

export function TimePicker({ value, onChange, label, placeholder = "Select time", interval = 15, use24Hour = false }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const times = useCallback(() => generateTimes(interval, use24Hour), [interval, use24Hour]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && value && listRef.current) {
      const idx = times().findIndex(t => t.value === value);
      if (idx >= 0) {
        const item = listRef.current.children[idx] as HTMLElement;
        if (item) item.scrollIntoView({ block: "center" });
      }
    }
  }, [open]);

  const adjustTime = (direction: 1 | -1) => {
    if (!value) { onChange("10:00"); return; }
    const allTimes = times();
    const idx = allTimes.findIndex(t => t.value === value);
    const newIdx = Math.max(0, Math.min(allTimes.length - 1, idx + direction));
    onChange(allTimes[newIdx].value);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white hover:bg-gray-50 transition-colors text-left"
          >
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className={cn(!value && "text-gray-400")}>{value ? (use24Hour ? value : formatTime(value)) : placeholder}</span>
          </button>
          <div className="flex flex-col">
            <button type="button" onClick={() => adjustTime(1)} className="p-0.5 rounded hover:bg-gray-100 transition-colors"><ChevronUp className="w-3 h-3 text-gray-500" /></button>
            <button type="button" onClick={() => adjustTime(-1)} className="p-0.5 rounded hover:bg-gray-100 transition-colors"><ChevronDown className="w-3 h-3 text-gray-500" /></button>
          </div>
        </div>
        {open && (
          <div className="absolute z-50 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-48">
            <div ref={listRef} className="max-h-56 overflow-y-auto scrollbar-thin p-1">
              {times().map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { onChange(t.value); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                    value === t.value ? "bg-gray-900 text-white font-medium" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
