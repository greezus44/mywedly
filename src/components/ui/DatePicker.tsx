import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  className?: string;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISO(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DatePicker({ value, onChange, placeholder = "Select date", className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= numDays; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const prevMonth = useCallback(() => {
    setViewDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const nextMonth = useCallback(() => {
    setViewDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const selectDay = useCallback(
    (d: Date) => {
      onChange(toISODate(d));
      setOpen(false);
    },
    [onChange]
  );

  const today = new Date();
  const todayISO = toISODate(today);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text text-left focus:outline-none focus:ring-2 focus:ring-dash-primary/30 focus:border-dash-primary"
      >
        {value ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : placeholder}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg w-72">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" /></svg>
              </button>
              <span className="text-sm font-medium text-dash-text">{MONTHS[month]} {year}</span>
              <button type="button" onClick={nextMonth} className="rounded p-1 text-dash-muted hover:bg-dash-bg">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-xs font-medium text-dash-muted">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((d, i) => {
                if (!d) return <div key={i} />;
                const iso = toISODate(d);
                const isSelected = value === iso;
                const isToday = todayISO === iso;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(d)}
                    className={cn(
                      "rounded text-sm py-1 transition-colors",
                      isSelected ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg",
                      isToday && !isSelected && "ring-1 ring-dash-primary"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setViewDate(new Date());
                }}
                className="text-xs text-dash-primary hover:underline"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-dash-muted hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
