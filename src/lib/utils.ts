import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function formatDateShort(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime12(t: string | null | undefined): string {
  if (!t) return "";
  const normalized = t.includes(":") ? t : `${t}:00`;
  const [hStr, mStr] = normalized.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const dateStr = formatDate(date);
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateStr} at ${timeStr}`;
}

export function getCountdown(d: string | Date | null | undefined): { days: number; hours: number; minutes: number; seconds: number; isPast: boolean } {
  const target = typeof d === "string" ? new Date(d) : d;
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

export function to12Hour(time24: string): string {
  return formatTime12(time24);
}

export function to24Hour(time12: string): string {
  if (!time12) return "";
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function roundTo5Min(time: string): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (isNaN(h)) return time;
  const rounded = Math.round(m / 5) * 5;
  const finalH = rounded >= 60 ? h + 1 : h;
  const finalM = rounded >= 60 ? 0 : rounded;
  const fh = finalH >= 24 ? 0 : finalH;
  return `${String(fh).padStart(2, "0")}:${String(finalM).padStart(2, "0")}`;
}

export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const date = new Date(deadline);
  if (isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

export function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export function truncate(s: string, len: number): string {
  if (!s) return "";
  if (s.length <= len) return s;
  return s.slice(0, len - 1) + "…";
}
