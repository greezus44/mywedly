import { useState, useRef, useEffect } from "react";
import { cn, to24Hour, roundTo5Min } from "../../lib/utils";

interface TimePickerProps {
  value: string; // 24h "HH:MM"
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
}

function buildTimeList(): { display: string; value: string }[] {
  const list: { display: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const hStr = String(h).padStart(2, "0");
      const mStr = String(m).padStart(2, "0");
      const value = `${hStr}:${mStr}`;
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const display = `${h12}:${mStr} ${period}`;
      list.push({ display, value });
    }
  }
  return list;
}

const TIME_LIST = buildTimeList();

export function TimePicker({ value, onChange, label, placeholder = "Select time" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const normalised = value ? roundTo5Min(value) : "";
  const selected = TIME_LIST.find((t) => t.value === normalised);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current && selected) {
      const idx = TIME_LIST.findIndex((t) => t.value === normalised);
      const li = listRef.current.children[idx] as HTMLElement | undefined;
      if (li) li.scrollIntoView({ block: "nearest" });
    }
  }, [open, normalised, selected]);

  const display12 = value
    ? (() => {
        const [h, m] = value.split(":");
        const hNum = parseInt(h, 10);
        if (isNaN(hNum)) return value;
        const period = hNum >= 12 ? "PM" : "AM";
        const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
        return `${h12}:${(m ?? "00").padStart(2, "0")} ${period}`;
      })()
    : "";

  return (
    <div ref={containerRef} className="relative w-full">
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-dash-primary/50 focus:border-dash-primary transition-colors"
      >
        <span className={cn(display12 ? "text-dash-text" : "text-dash-muted")}>
          {display12 || placeholder}
        </span>
        <svg className="h-4 w-4 text-dash-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-48 rounded-md border border-dash-border bg-dash-surface shadow-lg overflow-hidden">
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
            {TIME_LIST.map((t) => (
              <li key={t.value}>
                <button
                  type="button"
                  onClick={() => { onChange(t.value); setOpen(false); }}
                  className={cn(
                    "w-full px-4 py-2 text-sm text-left transition-colors",
                    normalised === t.value
                      ? "bg-dash-primary text-white font-medium"
                      : "text-dash-text hover:bg-dash-surface-alt",
                  )}
                >
                  {t.display}
                </button>
              </li>
            ))}
          </ul>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full px-4 py-2 text-xs text-dash-muted hover:text-dash-text border-t border-dash-border text-center"
            >
              Clear time
            </button>
          )}
        </div>
      )}
    </div>
  );
}
