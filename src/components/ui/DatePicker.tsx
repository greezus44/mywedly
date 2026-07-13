import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
  label?: string;
  className?: string;
  minDate?: string | null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ value, onChange, label, className, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initial = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = value ? new Date(value + "T00:00:00") : null;
  const minD = minDate ? new Date(minDate + "T00:00:00") : null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };
  const prevYear = () => setViewYear(viewYear - 1);
  const nextYear = () => setViewYear(viewYear + 1);

  const selectDate = (day: number) => {
    const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    onChange(dateStr);
    setOpen(false);
  };

  const isToday = (day: number) => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };
  const isSelected = (day: number) => {
    return selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;
  };
  const isDisabled = (day: number) => {
    if (!minD) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d < minD;
  };

  const displayValue = value ? formatDateDisplay(value) : "";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white hover:border-gray-400 transition-colors text-gray-900"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={value ? "" : "text-gray-400"}>{displayValue || "Select date"}</span>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-fade-in" style={{ minWidth: "300px" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <button type="button" onClick={prevYear} className="px-1.5 py-1 hover:bg-gray-100 rounded transition-colors text-xs text-gray-500" aria-label="Previous year"><ChevronLeft className="w-3 h-3" /></button>
              <button type="button" onClick={prevMonth} className="px-1.5 py-1 hover:bg-gray-100 rounded transition-colors" aria-label="Previous month"><ChevronLeft className="w-4 h-4 text-gray-700" /></button>
            </div>
            <span className="text-sm font-medium text-gray-900">{MONTHS[viewMonth]} {viewYear}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={nextMonth} className="px-1.5 py-1 hover:bg-gray-100 rounded transition-colors" aria-label="Next month"><ChevronRight className="w-4 h-4 text-gray-700" /></button>
              <button type="button" onClick={nextYear} className="px-1.5 py-1 hover:bg-gray-100 rounded transition-colors text-xs text-gray-500" aria-label="Next year"><ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDisabled(day);
              const selected_ = isSelected(day);
              const today_ = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !disabled && selectDate(day)}
                  disabled={disabled}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center text-sm rounded-md transition-colors",
                    selected_ && "bg-gray-900 text-white font-medium",
                    !selected_ && !disabled && "hover:bg-gray-100 text-gray-700",
                    !selected_ && today_ && "ring-1 ring-gray-300 font-medium",
                    disabled && "text-gray-300 cursor-not-allowed"
                  )}
                  aria-pressed={selected_ ? true : undefined}
                  aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
            <button type="button" onClick={() => { const t = new Date(); setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); }} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Today</button>
            {value && <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-gray-500 hover:text-red-600 transition-colors">Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
