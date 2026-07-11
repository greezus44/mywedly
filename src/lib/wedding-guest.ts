import { createContext, useContext } from "react";

export type Lang = "en" | "ms";

export const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, ms: string) => string;
}>({ lang: "en", setLang: () => {}, t: (en) => en });

export const useLang = () => useContext(LangContext);

export type GuestSession = {
  guestId: string;
  weddingId: string;
  name: string;
  password: string;
};

export function guestKey(slug: string) {
  return `mywedly:guest:${slug}`;
}

export function getGuestSession(slug: string): GuestSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(guestKey(slug));
    if (!raw) return null;
    // Back-compat: earlier versions stored just the name.
    if (raw.startsWith("{")) return JSON.parse(raw) as GuestSession;
    return null;
  } catch {
    return null;
  }
}

export function getGuestName(slug: string): string | null {
  return getGuestSession(slug)?.name ?? null;
}

export function setGuestSession(slug: string, s: GuestSession) {
  try {
    localStorage.setItem(guestKey(slug), JSON.stringify(s));
  } catch {}
}

export function clearGuestName(slug: string) {
  try {
    localStorage.removeItem(guestKey(slug));
  } catch {}
}

export function formatMonthYear(dateStr: string | null, lang: Lang): string {
  if (!dateStr) return lang === "ms" ? "TARIKH AKAN DIUMUMKAN" : "DATE TO BE ANNOUNCED";
  const d = new Date(dateStr + "T00:00:00");
  const months = lang === "ms"
    ? ["JANUARI","FEBRUARI","MAC","APRIL","MEI","JUN","JULAI","OGOS","SEPTEMBER","OKTOBER","NOVEMBER","DISEMBER"]
    : ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatEventDate(iso: string | null, lang: Lang) {
  if (!iso) return { dow: "", day: "", mon: "", year: "" };
  const d = new Date(iso);
  const dowEn = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const dowMs = ["AHD","ISN","SEL","RAB","KHA","JUM","SAB"];
  const monEn = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const monMs = ["JAN","FEB","MAC","APR","MEI","JUN","JUL","OGO","SEP","OKT","NOV","DIS"];
  return {
    dow: (lang === "ms" ? dowMs : dowEn)[d.getDay()],
    day: String(d.getDate()),
    mon: (lang === "ms" ? monMs : monEn)[d.getMonth()],
    year: String(d.getFullYear()),
  };
}

export function formatEventTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  let h = d.getHours(); const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12; if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
}
