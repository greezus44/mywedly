import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function to12Hour(time24: string | null | undefined): { hour: number; minute: number; period: "AM" | "PM" } {
  let hour = 0;
  let minute = 0;
  if (time24) {
    const [h, m] = time24.split(":").map((n) => parseInt(n, 10));
    if (!isNaN(h)) hour = h;
    if (!isNaN(m)) minute = m;
  }
  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return { hour: displayHour, minute, period };
}

export function formatTime12(time24: string | null | undefined): string {
  if (!time24) return "";
  const { hour, minute, period } = to12Hour(time24);
  const mm = minute.toString().padStart(2, "0");
  return `${hour}:${mm} ${period}`;
}

export function to24Hour(hour: number, minute: number, period: "AM" | "PM"): string {
  let h = hour;
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function roundTo5Min(minute: number): number {
  return Math.round(minute / 5) * 5 % 60;
}

export function getCountdown(targetDate: string | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const target = new Date(targetDate + "T00:00:00").getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  return Date.now() > d.getTime();
}

export function generateUsername(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}${suffix}`;
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function formatDateTime(dateStr: string | null | undefined, timeStr: string | null | undefined): string {
  const date = formatDateShort(dateStr);
  const time = formatTime12(timeStr);
  if (date && time) return `${date} • ${time}`;
  return date || time || "";
}
