import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, label, placeholder = "Select date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayDate = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(displayDate.getMonth());
  const [viewYear, setViewYear] = useState(displayDate.getFullYear());

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month: number, year: number) => new Date(year, month, 1).getDay();

  const days = getDaysInMonth(viewMonth, viewYear);
  const firstDay = getFirstDay(viewMonth, viewYear);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDate = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    onChange(date.toISOString().split("T")[0]);
    setOpen(false);
  };

  const formatDateDisplay = (val: string | null) => {
    if (!val) return placeholder;
    const d = new Date(val);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:border-gray-900"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className={cn(!value && "text-gray-400")}>{formatDateDisplay(value)}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-semibold">{monthNames[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const dateStr = new Date(viewYear, viewMonth, day).toISOString().split("T")[0];
              const isSelected = value === dateStr;
              const isToday = todayStr === dateStr;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded text-sm transition-colors",
                    isSelected ? "bg-black text-white" : "hover:bg-gray-100",
                    isToday && !isSelected && "ring-1 ring-gray-900"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => { onChange(todayStr); setOpen(false); }} className="text-xs text-gray-600 hover:text-black">Today</button>
            <button type="button" onClick={() => { onChange(null); setOpen(false); }} className="text-xs text-gray-600 hover:text-black">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
