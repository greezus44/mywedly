import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn, formatDate, formatTime12, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

export interface DateTimePickerProps {
  date: string | null;
  time: string | null;
  onChange: (date: string, time: string) => void;
  label?: string;
  showTime?: boolean;
  minDate?: string | null;
  previewPrefix?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateInput(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DateTimePicker({
  date,
  time,
  onChange,
  label,
  showTime = true,
  minDate,
  previewPrefix,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"date" | "time">("date");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedDate = toDateInput(date);
  const min = toDateInput(minDate);

  const [viewYear, setViewYear] = useState(() => {
    const d = selectedDate || new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedDate || new Date();
    return d.getMonth();
  });

  React.useEffect(() => {
    const d = selectedDate || new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Time state
  const parsedTime = to12Hour(time);
  const [hour, setHour] = useState(parsedTime?.hour ?? 12);
  const [minute, setMinute] = useState(parsedTime ? roundTo5Min(parsedTime.minute) : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(parsedTime?.period ?? "AM");

  React.useEffect(() => {
    const p = to12Hour(time);
    if (p) {
      setHour(p.hour);
      setMinute(roundTo5Min(p.minute));
      setPeriod(p.period);
    }
  }, [time]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const today = new Date();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const prevYear = () => setViewYear((y) => y - 1);
  const nextYear = () => setViewYear((y) => y + 1);

  const handleSelectDate = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`, time || "");
    if (showTime) {
      setActiveTab("time");
    } else {
      setOpen(false);
    }
  };

  const handleToday = () => {
    const yyyy = today.getFullYear();
    const mm = (today.getMonth() + 1).toString().padStart(2, "0");
    const dd = today.getDate().toString().padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`, time || "");
  };

  const handleClearDate = () => {
    onChange("", time || "");
  };

  const isDisabled = (day: number): boolean => {
    if (!min) return false;
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const minCopy = new Date(min);
    minCopy.setHours(0, 0, 0, 0);
    return d < minCopy;
  };

  // Time adjustments
  const adjustHour = (delta: number) => {
    let h = hour + delta;
    if (h < 1) h = 12;
    if (h > 12) h = 1;
    setHour(h);
    onChange(date || "", to24Hour(h, minute, period));
  };

  const adjustMinute = (delta: number) => {
    let m = minute + delta;
    if (m < 0) m = 55;
    if (m > 55) m = 0;
    setMinute(m);
    onChange(date || "", to24Hour(hour, m, period));
  };

  const togglePeriod = () => {
    const p = period === "AM" ? "PM" : "AM";
    setPeriod(p);
    onChange(date || "", to24Hour(hour, minute, p));
  };

  const handleClearTime = () => {
    onChange(date || "", "");
  };

  const handleDone = () => {
    setOpen(false);
  };

  // Preview text
  const dateDisplay = date ? formatDate(date) : "";
  const timeDisplay = time ? formatTime12(time) : "";
  let preview = "";
  if (dateDisplay && timeDisplay) {
    preview = `${dateDisplay} at ${timeDisplay}`;
  } else if (dateDisplay) {
    preview = dateDisplay;
  } else if (timeDisplay) {
    preview = timeDisplay;
  }
  if (previewPrefix && preview) {
    preview = `${previewPrefix} ${preview}`;
  }

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 transition-colors",
          "hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400",
          !preview && "text-gray-400"
        )}
      >
        {preview || "Select date and time…"}
      </button>

      {open && (
        <div className="absolute z-50 mt-9 w-80 rounded-lg border border-gray-200 bg-white shadow-lg animate-fade-in">
          {/* Tabs */}
          {showTime && (
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("date")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "date"
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("time")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === "time"
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Time
              </button>
            </div>
          )}

          {/* Date Panel */}
          {activeTab === "date" && (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevYear}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Previous year"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <ChevronLeft className="-ml-3.5 h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    title="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    title="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextYear}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    title="Next year"
                  >
                    <ChevronRight className="h-3 w-3" />
                    <ChevronRight className="-ml-3.5 h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="py-1 text-[10px] font-medium uppercase text-gray-400"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {cells.map((day, idx) => {
                  if (day === null) return <div key={idx} />;
                  const dayDate = new Date(viewYear, viewMonth, day);
                  const isSelected = selectedDate && isSameDay(selectedDate, dayDate);
                  const isToday = isSameDay(today, dayDate);
                  const disabled = isDisabled(day);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelectDate(day)}
                      className={cn(
                        "h-8 w-8 rounded text-xs transition-colors",
                        disabled && "cursor-not-allowed text-gray-300",
                        !disabled && !isSelected && "text-gray-700 hover:bg-gray-100",
                        isToday && !isSelected && "ring-1 ring-gray-400",
                        isSelected && "bg-gray-900 text-white hover:bg-gray-700"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex justify-between gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="rounded px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                >
                  Today
                </button>
              </div>
            </div>
          )}

          {/* Time Panel */}
          {activeTab === "time" && (
            <div className="p-4">
              <div className="flex items-center justify-center gap-4">
                {/* Hour */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustHour(1)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <div className="flex h-10 w-12 items-center justify-center rounded border border-gray-200 text-lg font-semibold">
                    {hour}
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustHour(-1)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <span className="text-lg font-semibold text-gray-400">:</span>

                {/* Minute */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustMinute(5)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <div className="flex h-10 w-12 items-center justify-center rounded border border-gray-200 text-lg font-semibold">
                    {minute.toString().padStart(2, "0")}
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustMinute(-5)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* AM/PM */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={togglePeriod}
                    className={cn(
                      "rounded px-3 py-1.5 text-sm font-semibold transition-colors",
                      period === "AM"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={togglePeriod}
                    className={cn(
                      "rounded px-3 py-1.5 text-sm font-semibold transition-colors",
                      period === "PM"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>

              <div className="mt-3 flex justify-between gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={handleClearTime}
                  className="rounded px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
