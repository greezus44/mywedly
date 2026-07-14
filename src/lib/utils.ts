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
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime12(time: string | null | undefined): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatDateTime(date: string | Date | null | undefined, time?: string | null): string {
  const d = formatDate(date);
  const t = time ? formatTime12(time) : "";
  return [d, t].filter(Boolean).join(" at ");
}

export function getCountdown(target: string | Date | null | undefined): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
} {
  const empty = { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  if (!target) return empty;
  const d = typeof target === "string" ? new Date(target) : target;
  if (isNaN(d.getTime())) return empty;
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return { ...empty, isPast: true };
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
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "AM") {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function roundTo5Min(time: string): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time;
  const rounded = Math.round(m / 5) * 5;
  let newH = h;
  let newM = rounded;
  if (newM === 60) {
    newM = 0;
    newH = (h + 1) % 24;
  }
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

export function isRsvpClosed(deadline: string | Date | null | undefined): boolean {
  if (!deadline) return false;
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

const USERNAME_ADJECTIVES = ["happy", "sunny", "lucky", "bright", "joyful", "merry", "golden", "silver"];
const USERNAME_NOUNS = ["couple", "dove", "rose", "star", "moon", "heart", "bloom", "song"];

export function generateUsername(name: string): string {
  const base = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  const adj = USERNAME_ADJECTIVES[Math.floor(Math.random() * USERNAME_ADJECTIVES.length)];
  const noun = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${base || adj}${noun}${num}`;
}

export function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}
