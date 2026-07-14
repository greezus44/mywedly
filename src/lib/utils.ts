import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
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
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime12(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = isNaN(m) ? "00" : String(m).padStart(2, "0");
  return `${hour12}:${mm} ${period}`;
}

export function formatDateTime(dateStr: string | null | undefined, timeStr: string | null | undefined): string {
  const d = formatDate(dateStr);
  const t = formatTime12(timeStr);
  if (!d && !t) return "";
  if (!d) return t;
  if (!t) return d;
  return `${d} at ${t}`;
}

export function getCountdown(targetDate: string | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  const result = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  if (!targetDate) return result;
  const target = new Date(targetDate).getTime();
  if (isNaN(target)) return result;
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    result.isPast = true;
    return result;
  }
  result.days = Math.floor(diff / (1000 * 60 * 60 * 24));
  result.hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  result.minutes = Math.floor((diff / (1000 * 60)) % 60);
  result.seconds = Math.floor((diff / 1000) % 60);
  return result;
}

export function to12Hour(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const mm = isNaN(m) ? "00" : String(m).padStart(2, "0");
  return `${String(hour12).padStart(2, "0")}:${mm} ${period}`;
}

export function to24Hour(time12: string): string {
  if (!time12) return "";
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (!match) return time12;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function roundTo5Min(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  m = Math.round(m / 5) * 5;
  if (m === 60) {
    m = 0;
    // Don't overflow hour for simplicity; just reset minutes
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline).getTime();
  if (isNaN(d)) return false;
  return Date.now() > d;
}

export function generateUsername(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
