import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { LangContext, type Lang, clearGuestName, getGuestSession } from "@/lib/wedding-guest";
import { listPublishedCustomPages, type WeddingTheme } from "@/lib/wedding-queries";
import { motion, AnimatePresence } from "motion/react";

const STORAGE = "mywedly:lang";

export function GuestLayout({
  children,
  slug,
  weddingId,
  requireSignIn = false,
  showChrome = true,
  couple,
  theme,
}: {
  children: ReactNode;
  slug: string;
  weddingId?: string;
  requireSignIn?: boolean;
  showChrome?: boolean;
  couple: { one: string; two: string };
  theme?: WeddingTheme | null;
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
    if (!getGuestSession(slug)) {
      router.navigate({ to: "/w/$slug/signin", params: { slug } });
    }
  }, [requireSignIn, mounted, slug, router]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE, l);
    } catch {}
  };

  const t = (en: string, ms: string) => (lang === "ms" ? ms : en);

  const themeStyle: React.CSSProperties = {};
  if (theme?.accent) (themeStyle as any)["--sepia"] = theme.accent;
  if (theme?.bg) (themeStyle as any)["--parchment"] = theme.bg;
  if (theme?.serif) (themeStyle as any)["--font-serif"] = theme.serif;
  if (theme?.sans) (themeStyle as any)["--font-sans"] = theme.sans;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      <div
        className="min-h-screen bg-parchment text-sepia"
        style={{ fontFamily: "var(--font-sans)", ...themeStyle }}
      >
        {showChrome && <GuestHeader slug={slug} couple={couple} weddingId={weddingId} />}
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

function GuestHeader({
  slug,
  couple,
  weddingId,
}: {
  slug: string;
  couple: { one: string; two: string };
  weddingId?: string;
}) {
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
        {open && (
          <MenuOverlay
            slug={slug}
            couple={couple}
            weddingId={weddingId}
            onClose={() => setOpen(false)}
          />
        )}
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
      if (e.key === STORAGE && (e.newValue === "ms" || e.newValue === "en"))
        setLangState(e.newValue);
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);
  const set = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE, l);
    } catch {}
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE, newValue: l }));
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
        BAHASA
        <br />
        MELAYU
      </button>
    </div>
  );
}

function MenuOverlay({
  slug,
  couple,
  weddingId,
  onClose,
}: {
  slug: string;
  couple: { one: string; two: string };
  weddingId?: string;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE);
      if (s === "ms" || s === "en") setLang(s);
    } catch {}
  }, []);

  const { data: pages } = useQuery({
    queryKey: ["custom-pages-nav", weddingId],
    enabled: !!weddingId,
    queryFn: () => listPublishedCustomPages(weddingId!),
  });

  const coreLinks: Array<{ to: any; label: [string, string] }> = [
    { to: "/w/$slug", label: ["COVER", "MUKA HADAPAN"] },
    { to: "/w/$slug/invitation", label: ["INVITATION", "JEMPUTAN"] },
    { to: "/w/$slug/events", label: ["EVENTS & RSVP", "MAJLIS & RSVP"] },
    { to: "/w/$slug/info", label: ["INFORMATION", "MAKLUMAT"] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-parchment overflow-y-auto"
    >
      <div className="flex justify-between items-start px-6 md:px-14 pt-8">
        <div className="border-2 border-sepia/70 rounded-md p-3">
          <button onClick={onClose} aria-label="Close" className="block">
            <X className="w-6 h-6 text-sepia" strokeWidth={2.5} />
          </button>
        </div>
        <button
          onClick={() => {
            clearGuestName(slug);
            onClose();
            location.href = `/w/${slug}/signin`;
          }}
          className="text-[11px] tracking-[0.18em] text-sepia/60 hover:text-sepia py-3"
        >
          {lang === "ms" ? "LOG KELUAR" : "SIGN OUT"}
        </button>
      </div>
      <nav className="flex flex-col items-center justify-center py-16 gap-8">
        <div
          className="text-sepia text-6xl md:text-7xl mb-8"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500 }}
        >
          {couple.one[0]}
          <span className="opacity-60 mx-2">&</span>
          {couple.two[0]}
        </div>
        {coreLinks.map((l) => (
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
        {(pages ?? []).map((p) => (
          <Link
            key={p.id}
            to="/w/$slug/p/$pageSlug"
            params={{ slug, pageSlug: p.slug } as any}
            onClick={onClose}
            className="text-sepia text-[13px] tracking-[0.25em] font-medium hover:text-sepia/60 transition-colors uppercase"
          >
            {p.title}
          </Link>
        ))}
      </nav>
    </motion.div>
  );
}
