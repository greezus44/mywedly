export type Language = "en" | "ms";

export interface Translation {
  home: string; rsvp: string; doa: string; contact: string; sendMessage: string;
  enter: string; signOut: string; welcome: string;
  days: string; hours: string; minutes: string; seconds: string;
  attending: string; declined: string; pending: string;
  submit: string; cancel: string;
  messagePlaceholder: string; namePlaceholder: string;
  thankYou: string; rsvpSubmitted: string; messageSent: string; loading: string; invalidName: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    home: "Home", rsvp: "RSVP", doa: "Doa", contact: "Contact", sendMessage: "Send Message",
    enter: "Enter", signOut: "Sign Out", welcome: "Welcome",
    days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
    attending: "Attending", declined: "Declined", pending: "Pending",
    submit: "Submit", cancel: "Cancel",
    messagePlaceholder: "Write your message...", namePlaceholder: "Enter your name",
    thankYou: "Thank You!", rsvpSubmitted: "Your RSVP has been submitted.",
    messageSent: "Your message has been sent!", loading: "Loading...",
    invalidName: "Invalid name. Please check your invitation.",
  },
  ms: {
    home: "Utama", rsvp: "RSVP", doa: "Doa", contact: "Hubungi", sendMessage: "Hantar Mesej",
    enter: "Masuk", signOut: "Log Keluar", welcome: "Selamat Datang",
    days: "Hari", hours: "Jam", minutes: "Minit", seconds: "Saat",
    attending: "Hadir", declined: "Tidak Hadir", pending: "Menunggu",
    submit: "Hantar", cancel: "Batal",
    messagePlaceholder: "Tulis mesej anda...", namePlaceholder: "Masukkan nama anda",
    thankYou: "Terima Kasih!", rsvpSubmitted: "RSVP anda telah dihantar.",
    messageSent: "Mesej anda telah dihantar!", loading: "Memuatkan...",
    invalidName: "Nama tidak sah. Sila semak jemputan anda.",
  },
};
