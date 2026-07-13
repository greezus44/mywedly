import { useMemo } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

function to24(h12: string, period: "AM" | "PM"): string {
  let h = parseInt(h12, 10);
  if (isNaN(h)) h = 12;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return String(h).padStart(2, "0");
}

function from24(hhmm: string): { hour: string; minute: string; period: "AM" | "PM" } {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return { hour: "12", minute: "00", period: "AM" };
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  let period: "AM" | "PM" = "AM";
  if (h === 0) {
    h = 12;
    period = "AM";
  } else if (h >= 12) {
    period = "PM";
    if (h > 12) h -= 12;
  }
  return { hour: String(h).padStart(2, "0"), minute: m, period };
}

export function TimePicker12({ value, onChange, className }: Props) {
  const { hour, minute, period } = useMemo(() => from24(value), [value]);

  const setHour = (h: string) => onChange(`${to24(h, period)}:${minute}`);
  const setMinute = (m: string) => onChange(`${to24(hour, period)}:${m}`);
  const setPeriod = (p: "AM" | "PM") => onChange(`${to24(hour, p)}:${minute}`);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <select
        value={hour}
        onChange={(e) => setHour(e.target.value)}
        aria-label="Hour"
        className="border border-onyx/20 bg-transparent px-2 py-2 text-sm outline-none focus:border-onyx"
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-onyx/40">:</span>
      <select
        value={minute}
        onChange={(e) => setMinute(e.target.value)}
        aria-label="Minute"
        className="border border-onyx/20 bg-transparent px-2 py-2 text-sm outline-none focus:border-onyx"
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <div className="flex border border-onyx/20 rounded overflow-hidden">
        <button
          type="button"
          onClick={() => setPeriod("AM")}
          className={`px-3 py-2 text-xs ${period === "AM" ? "bg-onyx text-parchment" : "text-onyx/50"}`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => setPeriod("PM")}
          className={`px-3 py-2 text-xs ${period === "PM" ? "bg-onyx text-parchment" : "text-onyx/50"}`}
        >
          PM
        </button>
      </div>
    </div>
  );
}
