import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time24: string) => void;
  label?: string;
  className?: string;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const PERIODS: ("AM" | "PM")[] = ["AM", "PM"];

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const parsed = to12Hour(value);
  const [hour, setHour] = useState<number>(parsed?.hour ?? 12);
  const [minute, setMinute] = useState<number>(parsed ? roundTo5Min(parsed.minute) : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed?.period ?? "AM");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsed) {
      setHour(parsed.hour);
      setMinute(roundTo5Min(parsed.minute));
      setPeriod(parsed.period);
    }
  }, [value]);

  const emit = useCallback((h: number, m: number, p: "AM" | "PM") => {
    onChange(to24Hour(h, m, p));
  }, [onChange]);

  const adjustHour = (dir: number) => {
    const idx = HOURS.indexOf(hour);
    const next = HOURS[(idx + dir + HOURS.length) % HOURS.length];
    setHour(next);
    emit(next, minute, period);
  };

  const adjustMinute = (dir: number) => {
    const idx = MINUTES.indexOf(minute);
    const nextIdx = idx === -1 ? 0 : (idx + dir + MINUTES.length) % MINUTES.length;
    const next = MINUTES[nextIdx];
    setMinute(next);
    emit(hour, next, period);
  };

  const togglePeriod = () => {
    const next = period === "AM" ? "PM" : "AM";
    setPeriod(next);
    emit(hour, minute, next);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const display = value ? formatTime12Display(value) : "Select time";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white hover:border-gray-400 transition-colors text-gray-900"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "" : "text-gray-400"}>{display}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-fade-in" style={{ minWidth: "240px" }}>
          <div className="flex items-center gap-3">
            {/* Hour */}
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => adjustHour(1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Increment hour"><ChevronUp className="w-4 h-4 text-gray-600" /></button>
              <div className="w-12 h-10 flex items-center justify-center text-xl font-heading font-semibold text-gray-900 tabular-nums">{hour}</div>
              <button type="button" onClick={() => adjustHour(-1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Decrement hour"><ChevronDown className="w-4 h-4 text-gray-600" /></button>
            </div>
            <span className="text-xl font-heading text-gray-400 -mt-1">:</span>
            {/* Minute */}
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => adjustMinute(1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Increment minute"><ChevronUp className="w-4 h-4 text-gray-600" /></button>
              <div className="w-12 h-10 flex items-center justify-center text-xl font-heading font-semibold text-gray-900 tabular-nums">{minute.toString().padStart(2, "0")}</div>
              <button type="button" onClick={() => adjustMinute(-1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Decrement minute"><ChevronDown className="w-4 h-4 text-gray-600" /></button>
            </div>
            {/* AM/PM */}
            <div className="flex flex-col gap-1 ml-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPeriod(p); emit(hour, minute, p); }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-colors",
                    period === p ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime12Display(time24: string): string {
  const t = to12Hour(time24);
  if (!t) return "Select time";
  return `${t.hour}:${t.minute.toString().padStart(2, "0")} ${t.period}`;
}
