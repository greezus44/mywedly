import React, { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const h12 = to12Hour(value);
  const hour = h12?.hour || 12;
  const minute = h12 ? roundTo5Min(h12.minute) : 0;
  const period = h12?.period || "AM";

  const setHour = (h: number) => { const nh = ((h - 1 + 12) % 12) + 1; onChange(to24Hour(nh, minute, period)); };
  const setMinute = (m: number) => { const nm = ((m % 60) + 60) % 60; onChange(to24Hour(hour, nm, period)); };
  const setPeriod = (p: "AM" | "PM") => onChange(to24Hour(hour, minute, p));

  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-3 py-2 rounded-lg border border-dash-border bg-white text-dash-text text-left flex items-center justify-between">
        <span>{value ? `${hour}:${String(minute).padStart(2, "0")} ${period}` : "Select time"}</span>
        <ChevronDown className="w-4 h-4 text-dash-muted" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-dash-border rounded-lg shadow-lg p-3 flex gap-4">
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
    </div>
  );
}
