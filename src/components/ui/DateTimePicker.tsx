import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { to12Hour, to24Hour, roundTo5Min, formatDate, formatTime12 } from "../../lib/utils";

interface DateTimePickerProps {
  date: string | null; time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  label?: string; showTime?: boolean; minDate?: string; previewPrefix?: string;
}

export function DateTimePicker({ date, time, onChange, label, showTime = true, minDate, previewPrefix }: DateTimePickerProps) {
  const [tab, setTab] = useState<"date" | "time">("date");
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(date ? new Date(date + "T00:00:00") : new Date());
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const selectDate = (day: number) => onChange(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, time);
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  const isSelected = (day: number) => { if (!date) return false; const [vy, vm, vd] = date.split("-").map(Number); return vy === year && vm === month + 1 && vd === day; };
  const h12 = to12Hour(time);
  const hour = h12?.hour || 12, minute = h12 ? roundTo5Min(h12.minute) : 0, period = h12?.period || "AM";
  const setHour = (h: number) => { const nh = ((h - 1 + 12) % 12) + 1; onChange(date, to24Hour(nh, minute, period)); };
  const setMinute = (m: number) => { const nm = ((m % 60) + 60) % 60; onChange(date, to24Hour(hour, nm, period)); };
  const setPeriod = (p: "AM" | "PM") => onChange(date, to24Hour(hour, minute, p));
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const preview = date ? `${formatDate(date)}${showTime && time ? " at " + formatTime12(time) : ""}` : "Not set";

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-3 py-2 rounded-lg border border-dash-border bg-white text-dash-text text-left flex items-center justify-between">
        <span className="text-sm">{previewPrefix ? `${previewPrefix}: ` : ""}{preview}</span>
        <ChevronRight className="w-4 h-4 text-dash-muted rotate-90" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-dash-border rounded-lg shadow-lg p-3 w-80">
          {showTime && (
            <div className="flex gap-1 mb-3 border-b border-dash-border pb-2">
              <button type="button" onClick={() => setTab("date")} className={cn("px-3 py-1 rounded text-sm", tab === "date" ? "bg-dash-primary text-white" : "bg-slate-100")}>Date</button>
              <button type="button" onClick={() => setTab("time")} className={cn("px-3 py-1 rounded text-sm", tab === "time" ? "bg-dash-primary text-white" : "bg-slate-100")}>Time</button>
            </div>
          )}
          {tab === "date" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-medium">{monthNames[month]} {year}</span>
                <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">{dayNames.map((d) => <div key={d} className="text-center text-xs text-dash-muted py-1">{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => day ? (
                  <button key={i} type="button" onClick={() => selectDate(day)} className={cn("aspect-square rounded text-sm hover:bg-slate-100", isToday(day) && "ring-1 ring-dash-primary", isSelected(day) && "bg-dash-primary text-white hover:bg-dash-primary-hover")}>{day}</button>
                ) : <div key={i} />)}
              </div>
              <div className="flex justify-between mt-3 pt-2 border-t border-dash-border">
                <button type="button" onClick={() => { const t = new Date(); onChange(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`, time); }} className="text-sm text-dash-primary hover:underline">Today</button>
                <button type="button" onClick={() => onChange(null, time)} className="text-sm text-dash-muted hover:underline">Clear</button>
              </div>
            </>
          )}
          {tab === "time" && (
            <div className="flex gap-4 justify-center py-4">
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => setHour(hour + 1)} className="p-1 hover:bg-slate-100 rounded"><ChevronUp className="w-4 h-4" /></button>
                <span className="text-lg font-medium w-10 text-center">{hour}</span>
                <button type="button" onClick={() => setHour(hour - 1)} className="p-1 hover:bg-slate-100 rounded"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => setMinute(minute + 5)} className="p-1 hover:bg-slate-100 rounded"><ChevronUp className="w-4 h-4" /></button>
                <select value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="text-lg font-medium w-16 text-center border border-dash-border rounded">
                  {minutes.map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                </select>
                <button type="button" onClick={() => setMinute(minute - 5)} className="p-1 hover:bg-slate-100 rounded"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => setPeriod("AM")} className={cn("px-3 py-1 rounded text-sm", period === "AM" ? "bg-dash-primary text-white" : "bg-slate-100")}>AM</button>
                <button type="button" onClick={() => setPeriod("PM")} className={cn("px-3 py-1 rounded text-sm", period === "PM" ? "bg-dash-primary text-white" : "bg-slate-100")}>PM</button>
              </div>
            </div>
          )}
          <button type="button" onClick={() => setOpen(false)} className="w-full mt-3 py-2 bg-dash-primary text-white rounded text-sm hover:bg-dash-primary-hover">Done</button>
        </div>
      )}
    </div>
  );
}
