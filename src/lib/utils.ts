import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "Date TBA";
  try {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Date TBA";
  }
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "TBA";
  try {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "TBA";
  }
}

export function formatTime12(time: string | null | undefined): string {
  if (!time) return "Time TBA";
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${period}`;
  } catch {
    return "Time TBA";
  }
}

export function formatDateTime(date: string | null, time: string | null): string {
  return `${formatDate(date)} at ${formatTime12(time)}`;
}

export function getCountdown(targetDate: string | null): { days: number; hours: number; minutes: number; seconds: number; isPast: boolean } {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const target = new Date(targetDate + "T00:00:00").getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function isRsvpClosed(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function getRsvpStatus(deadline: string | null | undefined): "open" | "closing-soon" | "closed" {
  if (!deadline) return "open";
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl.getTime() - now.getTime();
  if (diff <= 0) return "closed";
  if (diff < 86400000) return "closing-soon";
  return "open";
}

export function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "No deadline set";
  const dl = new Date(deadline);
  return dl.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + dl.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function getEventStatus(event: { is_published: boolean; event_date: string | null; is_archived: boolean }): string {
  if (event.is_archived) return "Archived";
  if (event.is_published) return "Published";
  if (!event.event_date) return "Draft";
  return "Ready";
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function toDatetimeLocal(date: string | null, time: string | null): string {
  if (!date) return "";
  const t = time || "00:00";
  return `${date}T${t}`;
}

export function fromDatetimeLocal(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [date, time] = value.split("T");
  return { date, time: time || "00:00" };
}

export interface Hour12 { hour: number; minute: number; period: "AM" | "PM"; }

export function to12Hour(time24: string | null): Hour12 | null {
  if (!time24) return null;
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const period: "AM" | "PM" = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return { hour: hour12, minute: parseInt(m, 10), period };
}

export function to24Hour(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h = hour12;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function roundTo5Min(minute: number): number {
  return Math.round(minute / 5) * 5 % 60;
}
