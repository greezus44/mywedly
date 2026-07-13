export function formatDate(dateStr: string | null, lang: "en" | "ms" = "en"): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const locale = lang === "ms" ? "ms-MY" : "en-US";
  return date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(dateStr: string | null, lang: "en" | "ms" = "en"): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const locale = lang === "ms" ? "ms-MY" : "en-US";
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function formatShortDate(dateStr: string | null, lang: "en" | "ms" = "en"): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const locale = lang === "ms" ? "ms-MY" : "en-US";
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function getCountdown(targetDate: string | null): { days: number; hours: number; minutes: number; seconds: number; isPast: boolean } {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isPast: false,
  };
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
