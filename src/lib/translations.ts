import { useLanguage, type Language } from "./language";

/**
 * Picks the right text for the current language.
 * Priority:
 *   1. If language is BM and a custom BM text exists, use it.
 *   2. If language is BM and no custom BM, use an automatic translation from the dictionary (if available).
 *   3. Otherwise, use the English text.
 */
export function pickText(en: string | undefined, bmOverride: string | undefined, autoBm?: string): string {
  if (!en) return "";
  const lang = getCurrentLanguage();
  if (lang === "bm") {
    if (bmOverride && bmOverride.trim()) return bmOverride;
    if (autoBm) return autoBm;
    return en;
  }
  return en;
}

let currentLanguage: Language = "en";

export function setCurrentLanguage(lang: Language) {
  currentLanguage = lang;
}

function getCurrentLanguage(): Language {
  return currentLanguage;
}

/**
 * Hook that returns a `tr` function bound to the current language context.
 * Usage: const { tr } = useTranslation();
 * tr("Hello", "Hai")  — returns BM or EN string
 * tr("Hello")         — returns EN string (no BM provided, use EN)
 */
export function useTranslation() {
  const { language, t } = useLanguage();
  setCurrentLanguage(language);
  return { language, t, tr: t };
}

/**
 * Common automatic EN→BM translations for frequently-used UI strings.
 * Used as fallback when host hasn't provided a custom BM translation.
 */
export const AUTO_BM: Record<string, string> = {
  "Enter": "Masuk",
  "Welcome": "Selamat Datang",
  "Sign In": "Log Masuk",
  "Signing in...": "Sedang log masuk...",
  "Enter your username": "Masukkan nama pengguna anda",
  "Home": "Utama",
  "Messages": "Mesej",
  "RSVP": "RSVP",
  "RSVP Now": "RSVP Sekarang",
  "RSVP by": "RSVP sebelum",
  "Attending": "Hadir",
  "Declined": "Tidak Hadir",
  "Yes": "Ya",
  "No": "Tidak",
  "Bringing a +1?": "Membawa +1?",
  "Plus One Name": "Nama +1",
  "Enter +1 name": "Masukkan nama +1",
  "Save +1": "Simpan +1",
  "Saving…": "Menyimpan…",
  "Saved!": "Disimpan!",
  "Save failed": "Gagal menyimpan",
  "Send": "Hantar",
  "Sending...": "Menghantar...",
  "Write your message here...": "Tulis mesej anda di sini...",
  "No messages yet. Be the first to leave a message!": "Tiada mesej lagi. Jadi yang pertama meninggalkan mesej!",
  "Loading messages...": "Memuatkan mesej...",
  "Page Not Found": "Halaman Tidak Ditemui",
  "This page could not be found or is not published.": "Halaman ini tidak ditemui atau tidak diterbitkan.",
  "Back to Home": "Kembali ke Utama",
  "No content yet.": "Tiada kandungan lagi.",
  "Get in touch": "Hubungi kami",
  "Contact": "Hubungi",
  "Reach us with any questions about the celebration.": "Hubungi kami untuk sebarang soalan tentang majlis.",
  "When": "Bila",
  "Where": "Di Mana",
  "Email": "E-mel",
  "Phone": "Telefon",
  "Location": "Lokasi",
  "Back to home": "Kembali ke utama",
  "Contact details will be added soon.": "Butiran hubungan akan ditambah tidak lama lagi.",
  "Welcome to": "Selamat datang ke",
  "Check back soon for updates.": "Sila semak semula nanti untuk kemas kini.",
  "Sign Out": "Log Keluar",
};

/**
 * Returns the automatic BM translation for a given English string, or undefined.
 */
export function autoTranslate(en: string): string | undefined {
  return AUTO_BM[en];
}
