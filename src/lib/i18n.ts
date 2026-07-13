export type Language = "en" | "ms";

export const translations = {
  en: {
    enterInvitation: "Enter Invitation", pleaseEnterName: "Please enter your name to continue",
    yourFullName: "Your full name", continue: "Continue", nameNotFound: "Name not found in guest list",
    ourWedding: "Our Wedding", home: "Home", rsvp: "RSVP", guestbook: "Guestbook", doa: "Doa",
    contact: "Contact", sendMessage: "Send Message", attending: "Attending", notAttending: "Not Attending",
    maybe: "Maybe", submit: "Submit", days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
    saveTheDate: "Save the Date", ourStory: "Our Story", gallery: "Gallery", backToHome: "Back to Home",
    yourMessage: "Your Message", messageSent: "Message sent successfully!", rsvpSubmitted: "RSVP submitted successfully!",
    phone: "Phone", email: "Email", address: "Address", getDirections: "Get Directions",
  },
  ms: {
    enterInvitation: "Masuk Jemputan", pleaseEnterName: "Sila masukkan nama anda untuk meneruskan",
    yourFullName: "Nama penuh anda", continue: "Teruskan", nameNotFound: "Nama tidak dijumpai dalam senarai tetamu",
    ourWedding: "Perkahwinan Kami", home: "Utama", rsvp: "RSVP", guestbook: "Buku Tetamu", doa: "Doa",
    contact: "Hubungi", sendMessage: "Hantar Mesej", attending: "Hadir", notAttending: "Tidak Hadir",
    maybe: "Mungkin", submit: "Hantar", days: "Hari", hours: "Jam", minutes: "Minit", seconds: "Saat",
    saveTheDate: "Simpan Tarikh", ourStory: "Kisah Kami", gallery: "Galeri", backToHome: "Kembali ke Utama",
    yourMessage: "Mesej Anda", messageSent: "Mesej berjaya dihantar!", rsvpSubmitted: "RSVP berjaya dihantar!",
    phone: "Telefon", email: "E-mel", address: "Alamat", getDirections: "Dapatkan Arah",
  },
};

export type TranslationKey = keyof typeof translations.en;
