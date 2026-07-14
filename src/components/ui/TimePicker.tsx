import { useEffect, useMemo, useRef, useState } from "react";
import { cn, to12Hour, to24Hour } from "../../lib/utils";

interface TimePickerProps {
  value: string | null;
  onChange: (time24: string | null) => void;
  label?: string;
  className?: string;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    if (!value) return null;
    const [h, m] = value.split(":").map((n) => parseInt(n, 10));
    if (isNaN(h) || isNaN(m)) return null;
    const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return { hour: displayHour, minute: Math.round(m / 5) * 5 % 60, period };
  }, [value]);

  const [selHour, setSelHour] = useState<number>(parsed?.hour ?? 12);
  const [selMinute, setSelMinute] = useState<number>(parsed?.minute ?? 0);
  const [selPeriod, setSelPeriod] = useState<"AM" | "PM">(parsed?.period ?? "AM");

  useEffect(() => {
    if (parsed) {
      setSelHour(parsed.hour);
      setSelMinute(parsed.minute);
      setSelPeriod(parsed.period);
    }
  }, [parsed]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleConfirm = () => {
    const h12 = selHour === 12 ? 0 : selHour;
    const h24 = selPeriod === "PM" ? h12 + 12 : h12;
    const time24 = `${String(h24).padStart(2, "0")}:${String(selMinute).padStart(2, "0")}`;
    onChange(time24);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text hover:border-dash-primary"
      >
        <span className={cn(!value && "text-dash-muted")}>
          {value ? to12Hour(value) : "Select a time"}
        </span>
        <svg className="h-4 w-4 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg">
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="mb-1 text-xs font-medium text-dash-muted">Hour</p>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-dash-border scrollbar-thin">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelHour(h)}
                    className={cn(
                      "block w-full px-2 py-1 text-sm transition-colors",
                      selHour === h
                        ? "bg-dash-primary text-dash-primary-fg"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-medium text-dash-muted">Min</p>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-dash-border scrollbar-thin">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelMinute(m)}
                    className={cn(
                      "block w-full px-2 py-1 text-sm transition-colors",
                      selMinute === m
                        ? "bg-dash-primary text-dash-primary-fg"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-14">
              <p className="mb-1 text-xs font-medium text-dash-muted">AM/PM</p>
              <div className="rounded-lg border border-dash-border">
                {(["AM", "PM"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelPeriod(p)}
                    className={cn(
                      "block w-full px-2 py-1 text-sm transition-colors",
                      selPeriod === p
                        ? "bg-dash-primary text-dash-primary-fg"
                        : "text-dash-text hover:bg-dash-bg"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg px-2 py-1.5 text-xs text-dash-muted hover:bg-dash-bg"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="ml-auto rounded-lg bg-dash-primary px-3 py-1.5 text-xs font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
