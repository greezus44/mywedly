import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn, formatTime12, formatDate, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface DateTimePickerProps {
  /** ISO date string (YYYY-MM-DD) or null */
  date: string | null;
  /** 24-hour time string (HH:MM) or null */
  time: string | null;
  onChange: (date: string | null, time: string | null) => void;
  label?: string;
  /** Show the time selector (default true) */
  showTime?: boolean;
  /** Minimum date to prevent past selections */
  minDate?: string | null;
  /** Preview prefix, e.g. "RSVP closes" */
  previewPrefix?: string;
  className?: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function DateTimePicker({
  date,
  time,
  onChange,
  label,
  showTime = true,
  minDate,
  previewPrefix,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"date" | "time">("date");
  const containerRef = useRef<HTMLDivElement>(null);

  // Calendar state
  const initial = date ? new Date(date + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Time state (12-hour components)
  const parsed = to12Hour(time);
  const [hour, setHour] = useState(parsed?.hour ?? 12);
  const [minute, setMinute] = useState(parsed ? roundTo5Min(parsed.minute) : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed?.period ?? "AM");

  useEffect(() => {
    if (date) {
      const d = new Date(date + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [date]);

  useEffect(() => {
    if (time) {
      const p = to12Hour(time);
      if (p) { setHour(p.hour); setMinute(roundTo5Min(p.minute)); setPeriod(p.period); }
    }
  }, [time]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = date ? new Date(date + "T00:00:00") : null;
  const minD = minDate ? new Date(minDate + "T00:00:00") : null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };
  const prevYear = () => setViewYear(viewYear - 1);
  const nextYear = () => setViewYear(viewYear + 1);

  const selectDate = (day: number) => {
    const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    onChange(dateStr, time);
    if (showTime) setTab("time");
    else setOpen(false);
  };

  const isToday = (day: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  const isSelected = (day: number) => selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;
  const isDisabled = (day: number) => { if (!minD) return false; const d = new Date(viewYear, viewMonth, day); return d < minD; };

  const emitTime = (h: number, m: number, p: "AM" | "PM") => onChange(date, to24Hour(h, m, p));
  const adjustHour = (dir: number) => { const idx = HOURS.indexOf(hour); const next = HOURS[(idx + dir + HOURS.length) % HOURS.length]; setHour(next); emitTime(next, minute, period); };
  const adjustMinute = (dir: number) => { const idx = MINUTES.indexOf(minute); const nextIdx = idx === -1 ? 0 : (idx + dir + MINUTES.length) % MINUTES.length; const next = MINUTES[nextIdx]; setMinute(next); emitTime(hour, next, period); };
  const setP = (p: "AM" | "PM") => { setPeriod(p); emitTime(hour, minute, p); };

  const hasValue = date || time;
  const previewText = date ? formatDate(date) : "";
  const timeText = time ? formatTime12(time) : "";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>}

      <button
        type="button"
        onClick={() => { setOpen(!open); setTab("date"); }}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white hover:border-gray-400 transition-colors text-gray-900"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={hasValue ? "" : "text-gray-400"}>
            {previewPrefix && <span className="text-gray-400">{previewPrefix}: </span>}
            {previewText || "Select date"}
            {showTime && timeText && <span className="text-gray-400"> at {timeText}</span>}
          </span>
        </span>
        {hasValue && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null, null); }}
            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
            aria-label="Clear"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-fade-in" style={{ minWidth: "320px" }}>
          {/* Tabs */}
          {showTime && (
            <div className="flex gap-1 mb-4 border-b border-gray-100 pb-2">
              <button type="button" onClick={() => setTab("date")} className={cn("px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-colors", tab === "date" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100")}>
                <Calendar className="w-3.5 h-3.5 inline mr-1" /> Date
              </button>
              <button type="button" onClick={() => setTab("time")} className={cn("px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-colors", tab === "time" ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100")}>
                <Clock className="w-3.5 h-3.5 inline mr-1" /> Time
              </button>
            </div>
          )}

          {/* Date tab */}
          {tab === "date" && (
            <>
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
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const disabled = isDisabled(day);
                  const sel = isSelected(day);
                  const tod = isToday(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => !disabled && selectDate(day)}
                      disabled={disabled}
                      className={cn(
                        "h-9 w-9 flex items-center justify-center text-sm rounded-md transition-colors",
                        sel && "bg-gray-900 text-white font-medium",
                        !sel && !disabled && "hover:bg-gray-100 text-gray-700",
                        !sel && tod && "ring-1 ring-gray-300 font-medium",
                        disabled && "text-gray-300 cursor-not-allowed"
                      )}
                      aria-pressed={sel ? true : undefined}
                      aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                <button type="button" onClick={() => { const t = new Date(); setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); }} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Today</button>
                {date && <button type="button" onClick={() => onChange(null, time)} className="text-xs text-gray-500 hover:text-red-600 transition-colors">Clear date</button>}
              </div>
            </>
          )}

          {/* Time tab */}
          {tab === "time" && (
            <div className="py-2">
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center">
                  <button type="button" onClick={() => adjustHour(1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Increment hour"><ChevronUp className="w-4 h-4 text-gray-600" /></button>
                  <div className="w-12 h-10 flex items-center justify-center text-xl font-heading font-semibold text-gray-900 tabular-nums">{hour}</div>
                  <button type="button" onClick={() => adjustHour(-1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Decrement hour"><ChevronDown className="w-4 h-4 text-gray-600" /></button>
                </div>
                <span className="text-xl font-heading text-gray-400 -mt-1">:</span>
                <div className="flex flex-col items-center">
                  <button type="button" onClick={() => adjustMinute(1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Increment minute"><ChevronUp className="w-4 h-4 text-gray-600" /></button>
                  <div className="w-12 h-10 flex items-center justify-center text-xl font-heading font-semibold text-gray-900 tabular-nums">{minute.toString().padStart(2, "0")}</div>
                  <button type="button" onClick={() => adjustMinute(-1)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Decrement minute"><ChevronDown className="w-4 h-4 text-gray-600" /></button>
                </div>
                <div className="flex flex-col gap-1 ml-1">
                  {(["AM", "PM"] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setP(p)} className={cn("px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded transition-colors", period === p ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100")}>{p}</button>
                  ))}
                </div>
              </div>
              {time && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  {previewPrefix ? `${previewPrefix} ` : ""}
                  {previewText && <span className="text-gray-700">{previewText}</span>}
                  <span> at <span className="font-medium text-gray-900">{formatTime12(time)}</span></span>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                <button type="button" onClick={() => setTab("date")} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Back to date</button>
                {time && <button type="button" onClick={() => onChange(date, null)} className="text-xs text-gray-500 hover:text-red-600 transition-colors">Clear time</button>}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}


