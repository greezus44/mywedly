import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime12(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (h === undefined) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

export function getCountdown(targetDate: string | null | undefined) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isPast: false,
  };
}

export function to12Hour(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function to24Hour(time12: string) {
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hour: 0, minute: 0 };
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

export function roundTo5Min(date: Date): Date {
  const ms = 5 * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  return d.getTime() < Date.now();
}

export function generateUsername(name: string, existing: string[]): string {
  const parts = name.trim().toLowerCase().split(/\s+/);
  let base = parts[0] || "guest";
  if (parts.length > 1) base = parts[0] + "." + parts[parts.length - 1];
  base = base.replace(/[^a-z0-9.]/g, "");
  let username = base;
  let counter = 1;
  const existingLower = new Set(existing.map((u) => u.toLowerCase()));
  while (existingLower.has(username.toLowerCase())) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
