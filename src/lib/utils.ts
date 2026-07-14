import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
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
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function to12Hour(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return "";
  const m = mStr ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${period}`;
}

export function to24Hour(time12: string): string {
  if (!time12) return "";
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (!match) return "";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function formatTime12(time24: string | null | undefined): string {
  if (!time24) return "";
  return to12Hour(time24);
}

export function roundTo5Min(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const rounded = Math.round(m / 5) * 5;
  let newH = h;
  let newM = rounded;
  if (newM === 60) {
    newM = 0;
    newH = (h + 1) % 24;
  }
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function getCountdown(
  targetDate: string | null | undefined
): { days: number; hours: number; minutes: number; seconds: number; isPast: boolean } {
  const empty = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  if (!targetDate) return empty;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return empty;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { ...empty, isPast: true };
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
  return d.getTime() < Date.now();
}

export function generateUsername(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 30);
}

export function truncate(str: string, max: number): string {
  if (!str) return "";
  if (str.length <= max) return str;
  return str.substring(0, max - 1) + "…";
}
