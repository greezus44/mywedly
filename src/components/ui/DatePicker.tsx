import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
  label?: string;
  minDate?: string;
}

export function DatePicker({ value, onChange, label, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value + "T00:00:00") : new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const selectDate = (day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(date);
    setOpen(false);
  };

  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  const isSelected = (day: number) => { if (!value) return false; const [vy, vm, vd] = value.split("-").map(Number); return vy === year && vm === month + 1 && vd === day; };
  const isDisabled = (day: number) => { if (!minDate) return false; const d = new Date(year, month, day); const min = new Date(minDate + "T00:00:00"); return d < min; };

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-3 py-2 rounded-lg border border-dash-border bg-white text-dash-text text-left flex items-center justify-between">
        <span>{value ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select date"}</span>
        <ChevronRight className="w-4 h-4 text-dash-muted rotate-90" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-dash-border rounded-lg shadow-lg p-3 w-72">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-medium">{monthNames[month]} {year}</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((d) => <div key={d} className="text-center text-xs text-dash-muted py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => day ? (
              <button key={i} type="button" disabled={isDisabled(day)} onClick={() => selectDate(day)} className={cn("aspect-square rounded text-sm transition-colors", isDisabled(day) ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-100", isToday(day) && "ring-1 ring-dash-primary", isSelected(day) && "bg-dash-primary text-white hover:bg-dash-primary-hover")}>
                {day}
              </button>
            ) : <div key={i} />)}
          </div>
          <div className="flex justify-between mt-3 pt-2 border-t border-dash-border">
            <button type="button" onClick={() => { const t = new Date(); onChange(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`); setOpen(false); }} className="text-sm text-dash-primary hover:underline">Today</button>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-sm text-dash-muted hover:underline">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
