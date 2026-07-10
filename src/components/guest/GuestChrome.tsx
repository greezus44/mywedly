import { useState, useEffect, type ReactNode } from "react";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { LangContext, type Lang, clearGuestName, getGuestName } from "@/lib/wedding-guest";
import { motion, AnimatePresence } from "motion/react";

const STORAGE = "mywedly:lang";

export function GuestLayout({
  children,
  slug,
  requireSignIn = false,
  showChrome = true,
  couple,
}: {
  children: ReactNode;
  slug: string;
  requireSignIn?: boolean;
  showChrome?: boolean;
  couple: { one: string; two: string };
}) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE) as Lang | null;
      if (stored === "ms" || stored === "en") setLangState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    if (!requireSignIn || !mounted) return;
    if (!getGuestName(slug)) {
      router.navigate({ to: "/w/$slug/signin", params: { slug } });
    }
  }, [requireSignIn, mounted, slug, router]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE, l); } catch {}
  };

  const t = (en: string, ms: string) => (lang === "ms" ? ms : en);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div className="min-h-screen bg-parchment text-sepia" style={{ fontFamily: "var(--font-sans)" }}>
        {showChrome && <GuestHeader slug={slug} couple={couple} />}
        <AnimatePresence mode="wait">
          <motion.main
            key={router.state.location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 0.95] }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </LangContext.Provider>
  );
}

function GuestHeader({ slug, couple }: { slug: string; couple: { one: string; two: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="flex justify-between items-start px-6 md:px-14 pt-8 pb-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Menu"
          className="border-2 border-sepia/70 rounded-md p-3 hover:bg-sepia/5 transition-colors"
        >
          <Menu className="w-6 h-6 text-sepia" strokeWidth={2.5} />
        </button>
        <LangToggle />
      </header>
      <AnimatePresence>
        {open && <MenuOverlay slug={slug} couple={couple} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function LangToggle() {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE) as Lang | null;
      if (s === "ms" || s === "en") setLangState(s);
    } catch {}
    const on = (e: StorageEvent) => {
      if (e.key === STORAGE && (e.newValue === "ms" || e.newValue === "en")) setLangState(e.newValue);
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);
  const set = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE, l); } catch {}
    // Force refresh of consumers by dispatching a storage-like event
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE, newValue: l }));
    // Reload so LangContext picks up (simple approach for reliability)
    location.reload();
  };
  return (
    <div className="flex border-2 border-sepia/70 rounded-md overflow-hidden text-[11px] tracking-[0.18em] font-medium">
      <button
        onClick={() => set("en")}
        className={`px-4 py-2 transition-colors ${lang === "en" ? "bg-sepia/10 text-sepia" : "text-sepia/60 hover:text-sepia"}`}
      >
        ENGLISH
      </button>
      <button
        onClick={() => set("ms")}
        className={`px-4 py-2 leading-tight text-left transition-colors border-l-2 border-sepia/70 ${lang === "ms" ? "bg-sepia/10 text-sepia" : "text-sepia/60 hover:text-sepia"}`}
      >
        BAHASA<br />MELAYU
      </button>
    </div>
  );
}

function MenuOverlay({ slug, couple, onClose }: { slug: string; couple: { one: string; two: string }; onClose: () => void }) {
  const links: Array<{ to: any; label: [string, string] }> = [
    { to: "/w/$slug", label: ["COVER", "MUKA HADAPAN"] },
    { to: "/w/$slug/invitation", label: ["INVITATION", "JEMPUTAN"] },
    { to: "/w/$slug/events", label: ["EVENTS & RSVP", "MAJLIS & RSVP"] },
    { to: "/w/$slug/info", label: ["INFORMATION", "MAKLUMAT"] },
  ];
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => { try { const s = localStorage.getItem(STORAGE); if (s === "ms" || s === "en") setLang(s); } catch {} }, []);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-parchment"
    >
      <div className="flex justify-between items-start px-6 md:px-14 pt-8">
        <div className="border-2 border-sepia/70 rounded-md p-3">
          <button onClick={onClose} aria-label="Close" className="block"><X className="w-6 h-6 text-sepia" strokeWidth={2.5} /></button>
        </div>
        <button
          onClick={() => { clearGuestName(slug); onClose(); location.href = `/w/${slug}/signin`; }}
          className="text-[11px] tracking-[0.18em] text-sepia/60 hover:text-sepia py-3"
        >
          {lang === "ms" ? "LOG KELUAR" : "SIGN OUT"}
        </button>
      </div>
      <nav className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
        <div
          className="text-sepia text-6xl md:text-7xl mb-8"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
        >
          {couple.one[0]}<span className="opacity-60 mx-2">&</span>{couple.two[0]}
        </div>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            params={{ slug } as any}
            onClick={onClose}
            className="text-sepia text-[13px] tracking-[0.25em] font-medium hover:text-sepia/60 transition-colors"
          >
            {lang === "ms" ? l.label[1] : l.label[0]}
          </Link>
        ))}
      </nav>
    </motion.div>
  );
}
