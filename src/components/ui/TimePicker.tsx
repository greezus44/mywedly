import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";

export interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  placeholder?: string;
}

function to24Hour(hour: number, ampm: "AM" | "PM"): number {
  if (ampm === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

function to12Hour(h24: number): { hour: number; ampm: "AM" | "PM" } {
  const ampm = h24 >= 12 ? "PM" : "AM";
  const hour = h24 % 12 || 12;
  return { hour, ampm };
}

function parseTime(raw: string | null): { hour: number; minute: number; ampm: "AM" | "PM" } | null {
  if (!raw) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  const { hour, ampm } = to12Hour(h);
  return { hour, minute: m, ampm };
}

export function TimePicker({ value, onChange, placeholder = "Select time" }: TimePickerProps) {
  const parsed = useMemo(() => parseTime(value), [value]);
  const [hour, setHour] = useState<string>(parsed ? String(parsed.hour) : "");
  const [minute, setMinute] = useState<string>(parsed ? String(parsed.minute).padStart(2, "0") : "");
  const [ampm, setAmpm] = useState<"AM" | "PM">(parsed ? parsed.ampm : "AM");

  useEffect(() => {
    const p = parseTime(value);
    if (p) {
      setHour(String(p.hour));
      setMinute(String(p.minute).padStart(2, "0"));
      setAmpm(p.ampm);
    } else if (!value) {
      setHour("");
      setMinute("");
    }
  }, [value]);

  const commit = (h: string, m: string, am: "AM" | "PM") => {
    const hi = parseInt(h, 10);
    const mi = parseInt(m, 10);
    if (!h || !m || isNaN(hi) || isNaN(mi)) {
      onChange(null);
      return;
    }
    const h24 = to24Hour(hi, am);
    if (h24 < 0 || h24 > 23 || mi < 0 || mi > 59) {
      onChange(null);
      return;
    }
    onChange(`${String(h24).padStart(2, "0")}:${String(mi).padStart(2, "0")}`);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        max={12}
        value={hour}
        placeholder="HH"
        onChange={(e) => {
          setHour(e.target.value);
          commit(e.target.value, minute, ampm);
        }}
        className={cn(
          "h-10 w-16 rounded-md border border-gray-300 bg-white px-2 text-center text-sm shadow-sm",
          "focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900",
        )}
      />
      <span className="text-gray-500">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={minute}
        placeholder="MM"
        onChange={(e) => {
          setMinute(e.target.value);
          commit(hour, e.target.value, ampm);
        }}
        className={cn(
          "h-10 w-16 rounded-md border border-gray-300 bg-white px-2 text-center text-sm shadow-sm",
          "focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900",
        )}
      />
      <select
        value={ampm}
        onChange={(e) => {
          const next = e.target.value as "AM" | "PM";
          setAmpm(next);
          commit(hour, minute, next);
        }}
        className={cn(
          "h-10 w-20 rounded-md border border-gray-300 bg-white px-2 text-center text-sm shadow-sm",
          "focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900",
        )}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
      {!value && (
        <span className="text-xs text-gray-400">{placeholder}</span>
      )}
    </div>
  );
}
