type Props = { value: string; onChange: (val: string) => void };

export function TimePicker12({ value, onChange }: Props) {
  let h = "12", m = "00", ap = "AM";
  if (value && value.includes(":")) {
    const [hh, mm] = value.split(":");
    const hi = parseInt(hh, 10);
    ap = hi >= 12 ? "PM" : "AM";
    h = String(hi % 12 || 12);
    m = mm;
  }
  const setHour = (v: string) => { let hi = parseInt(v, 10) || 12; if (ap === "PM") hi = hi === 12 ? 12 : hi + 12; else hi = hi === 12 ? 0 : hi; onChange(`${String(hi).padStart(2, "0")}:${m}`); };
  const setMin = (v: string) => onChange(`${h}:${v.padStart(2, "0")}`);
  const setAp = (v: string) => { ap = v; let hi = parseInt(h, 10) || 12; if (v === "PM") hi = hi === 12 ? 12 : hi + 12; else hi = hi === 12 ? 0 : hi; onChange(`${String(hi).padStart(2, "0")}:${m}`); };
  return (
    <div className="flex gap-2 items-center">
      <select value={h} onChange={(e) => setHour(e.target.value)} className="border border-onyx/20 p-2 text-sm bg-transparent">{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={String(n)}>{n}</option>)}</select>
      <span className="text-sepia">:</span>
      <select value={m} onChange={(e) => setMin(e.target.value)} className="border border-onyx/20 p-2 text-sm bg-transparent">{Array.from({ length: 60 }, (_, i) => i).map((n) => <option key={n} value={String(n).padStart(2, "0")}>{String(n).padStart(2, "0")}</option>)}</select>
      <select value={ap} onChange={(e) => setAp(e.target.value)} className="border border-onyx/20 p-2 text-sm bg-transparent"><option value="AM">AM</option><option value="PM">PM</option></select>
    </div>
  );
}
