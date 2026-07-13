import { useState, useRef, useEffect, type ReactNode } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../lib/utils";
interface DatePickerProps { value: string | null; onChange: (value: string | null) => void; label?: string; placeholder?: string; }
export function DatePicker({ value, onChange, label, placeholder = "Select date" }: DatePickerProps) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler); }, []);
  const current = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(current.getMonth()); const [viewYear, setViewYear] = useState(current.getFullYear());
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", { month: "long" }); const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate(); const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };
  const selectDay = (day: number) => { onChange(new Date(viewYear, viewMonth, day).toISOString().split("T")[0]); setOpen(false); };
  const displayValue = value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  return (
    <div className="relative" ref={ref}>
      {label && <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>}
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 hover:border-gray-900 transition-colors rounded-md"><Calendar className="w-4 h-4 text-gray-400" /><span className={cn(!displayValue && "text-gray-400")}>{displayValue || placeholder}</span></button>
      {open && <div className="absolute z-50 mt-1 bg-white border border-gray-200 shadow-lg p-3 w-72 rounded-md"><div className="flex items-center justify-between mb-3"><button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button><span className="text-sm font-medium">{monthName} {viewYear}</span><button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button></div><div className="grid grid-cols-7 gap-1 text-xs">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-center text-gray-400 font-medium py-1">{d}</div>)}{Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}{Array.from({ length: daysInMonth }).map((_, i) => { const day = i + 1; const isSelected = value && new Date(value).toDateString() === new Date(viewYear, viewMonth, day).toDateString(); return <button key={day} type="button" onClick={() => selectDay(day)} className={cn("w-8 h-8 text-center hover:bg-gray-100 transition-colors rounded", isSelected && "bg-gray-900 text-white hover:bg-gray-700")}>{day}</button>; })}</div>{value && <button type="button" onClick={() => { onChange(null); setOpen(false); }} className="mt-2 w-full text-xs text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1"><X className="w-3 h-3" /> Clear</button>}</div>}
    </div>
  );
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}><div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in rounded-lg" onClick={(e) => e.stopPropagation()}>{title && <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-heading text-gray-900">{title}</h2><button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button></div>}<div className="p-6">{children}</div></div></div>;
}
