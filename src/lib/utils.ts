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

export function getCountdown(targetDate: string | null): { days: number; hours: number; minutes: number; seconds: number; isPast: boolean } {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const target = new Date(targetDate).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  return { days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000), isPast: false };
}

export function cn(...classes: (string | false | null | undefined)[]): string { return classes.filter(Boolean).join(" "); }
