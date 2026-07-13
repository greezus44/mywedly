import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn, formatDate } from "../../lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  min?: string | null;
  max?: string | null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DatePicker({ value, onChange, label, placeholder = "Select date", min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedDate = value ? new Date(value) : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;
  const isDisabled = useCallback((d: Date) => { if (minDate && d < minDate) return true; if (maxDate && d > maxDate) return true; return false; }, [minDate, maxDate]);

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) week.push(null);
  for (let d = 1; d <= daysInMonth; d++) { week.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d)); if (week.length === 7) { weeks.push(week); week = []; } }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const handleSelect = (d: Date) => { if (isDisabled(d)) return; const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; onChange(iso); setOpen(false); };
  const isSameDay = (a: Date | null, b: Date | null) => { if (!a || !b) return false; return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white hover:bg-gray-50 transition-colors text-left">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className={cn(!value && "text-gray-400")}>{value ? formatDate(value) : placeholder}</span>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-72">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-1 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold text-gray-900">{MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
              <button type="button" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-1 rounded-lg hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">{DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((d, i) => {
                if (!d) return <div key={i} />;
                const isSelected = isSameDay(d, selectedDate);
                const isToday = isSameDay(d, today);
                return <button key={i} type="button" onClick={() => handleSelect(d)} disabled={isDisabled(d)} className={cn("w-8 h-8 rounded-lg text-sm transition-colors flex items-center justify-center", isSelected && "bg-gray-900 text-white font-medium", !isSelected && !isDisabled(d) && "text-gray-700 hover:bg-gray-100", isToday && !isSelected && "ring-1 ring-gray-300", isDisabled(d) && "text-gray-300 cursor-not-allowed")}>{d.getDate()}</button>;
              })}
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
              <button type="button" onClick={() => { onChange(null); setOpen(false); }} className="text-xs text-gray-500 hover:text-gray-900">Clear</button>
              <button type="button" onClick={() => handleSelect(new Date())} className="text-xs text-gray-500 hover:text-gray-900">Today</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
