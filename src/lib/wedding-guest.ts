export type Lang = "en" | "ms";

export function t(en: string, ms: string, lang: Lang): string {
  return lang === "ms" ? ms : en;
}

export function formatEventDate(iso: string | null, lang: Lang): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(lang === "ms" ? "ms-MY" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatEventTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
}
