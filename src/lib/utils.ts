import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime12(time: string | null | undefined): string {
  if (!time) return "";
  return to12Hour(time);
}

export function to12Hour(time: string): string {
  const [hStr, m] = time.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

export function to24Hour(time12: string): string {
  const match = time12.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return time12;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function roundTo5Min(time: string): string {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  const rounded = Math.round(m / 5) * 5;
  let newH = h;
  let newM = rounded;
  if (rounded === 60) {
    newM = 0;
    newH = (h + 1) % 24;
  }
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function getCountdown(target: string | Date | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
} {
  const targetDate = typeof target === "string" ? new Date(target) : target;
  if (!targetDate || isNaN(targetDate.getTime())) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };
  }
  const now = new Date().getTime();
  const diff = targetDate.getTime() - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, done: false };
}

export function isRsvpClosed(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20);
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
