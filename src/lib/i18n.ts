export type Language = "en" | "ms";

export const translations = {
  en: { enter: "Enter", enterWebsite: "Enter Website", welcome: "Welcome", home: "Home", rsvp: "RSVP", events: "Events", contact: "Contact", doa: "Doa", sendMessage: "Send Message", gallery: "Gallery", guestLogin: "Guest Sign In", username: "Username", language: "Language", days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds", accept: "Accept", decline: "Decline", accepted: "Accepted", declined: "Declined", pending: "Pending", date: "Date", time: "Time", venue: "Venue", address: "Address", dressCode: "Dress Code", programme: "Programme", submit: "Submit", messageSent: "Message sent successfully!", charactersRemaining: "characters remaining", selectLanguage: "Select Language", english: "English", bahasaMelayu: "Bahasa Melayu", loading: "Loading...", noEvents: "No events available", invitation: "Invitation", bismillah: "In the name of Allah, the Most Gracious, the Most Merciful" },
  ms: { enter: "Masuk", enterWebsite: "Masuk Laman Web", welcome: "Selamat Datang", home: "Utama", rsvp: "RSVP", events: "Acara", contact: "Hubungi", doa: "Doa", sendMessage: "Hantar Mesej", gallery: "Galeri", guestLogin: "Daftar Masuk Tetamu", username: "Nama Pengguna", language: "Bahasa", days: "Hari", hours: "Jam", minutes: "Minit", seconds: "Saat", accept: "Terima", decline: "Tolak", accepted: "Diterima", declined: "Ditolak", pending: "Menunggu", date: "Tarikh", time: "Masa", venue: "Tempat", address: "Alamat", dressCode: "Pakaian", programme: "Program", submit: "Hantar", messageSent: "Mesej berjaya dihantar!", charactersRemaining: "aksara lagi", selectLanguage: "Pilih Bahasa", english: "English", bahasaMelayu: "Bahasa Melayu", loading: "Memuatkan...", noEvents: "Tiada acara tersedia", invitation: "Jemputan", bismillah: "Dengan nama Allah, Yang Maha Pemurah, Yang Maha Penyayang" },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.en[key] || key;
}
