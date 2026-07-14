import { useCallback, useMemo, useState } from "react";
import { cn, to12Hour, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimePicker({ value, onChange, className, placeholder = "Select time" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<"AM" | "PM">(() => {
    if (!value) return "AM";
    const h = parseInt(value.split(":")[0], 10);
    return h >= 12 ? "PM" : "AM";
  });

  const hours = useMemo(() => {
    if (!value) return { h: 9, display: "9" };
    const h = parseInt(value.split(":")[0], 10);
    const display = h === 0 ? "12" : h > 12 ? String(h - 12) : String(h);
    return { h, display };
  }, [value]);

  const minutes = useMemo(() => {
    if (!value) return "00";
    return value.split(":")[1] ?? "00";
  }, [value]);

  const hourOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: String(i + 1),
    }));
  }, []);

  const minuteOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let m = 0; m < 60; m += 5) {
      const val = String(m).padStart(2, "0");
      opts.push({ value: val, label: val });
    }
    return opts;
  }, []);

  const handleHourChange = useCallback(
    (hour12: number) => {
      let h24 = hour12;
      if (period === "PM" && hour12 !== 12) h24 += 12;
      if (period === "AM" && hour12 === 12) h24 = 0;
      const newTime = roundTo5Min(`${String(h24).padStart(2, "0")}:${minutes}`);
      onChange(newTime);
    },
    [period, minutes, onChange]
  );

  const handleMinuteChange = useCallback(
    (m: string) => {
      let h24 = hours.h;
      if (period === "PM" && h24 !== 12 && h24 < 12) h24 += 12;
      if (period === "AM" && h24 === 12) h24 = 0;
      const newTime = `${String(h24).padStart(2, "0")}:${m}`;
      onChange(newTime);
    },
    [hours.h, period, onChange]
  );

  const handlePeriodChange = useCallback(
    (p: "AM" | "PM") => {
      setPeriod(p);
      let h24 = hours.h;
      if (p === "PM" && h24 < 12) h24 += 12;
      if (p === "AM" && h24 >= 12) h24 -= 12;
      if (p === "AM" && h24 === 12) h24 = 0;
      const newTime = `${String(h24).padStart(2, "0")}:${minutes}`;
      onChange(newTime);
    },
    [hours.h, minutes, onChange]
  );

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text text-left focus:outline-none focus:ring-2 focus:ring-dash-primary/30 focus:border-dash-primary"
      >
        {value ? to12Hour(value) : placeholder}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 rounded-lg border border-dash-border bg-dash-surface p-3 shadow-lg flex gap-2">
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto scrollbar-thin">
              {hourOptions.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => handleHourChange(h.value)}
                  className={cn(
                    "rounded px-3 py-1 text-sm text-center transition-colors",
                    hours.display === h.label
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto scrollbar-thin">
              {minuteOptions.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleMinuteChange(m.value)}
                  className={cn(
                    "rounded px-3 py-1 text-sm text-center transition-colors",
                    minutes === m.value
                      ? "bg-dash-primary text-dash-primary-fg"
                      : "text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handlePeriodChange("AM")}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  period === "AM" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodChange("PM")}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  period === "PM" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-text hover:bg-dash-bg"
                )}
              >
                PM
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
