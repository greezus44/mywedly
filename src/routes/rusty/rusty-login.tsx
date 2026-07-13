import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import type { CSSProperties, FormEvent } from "react";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Lang } from "./rusty-layout";

const CREAM = "#FAF3E0";
const GOLD = "#B8962E";
const TEXT = "#3D3528";
const TEXT_MUTED = "#8B7355";
const BORDER = "#D4C695";

export function RustyLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, isAuthenticated, eventId: authEventId } = useGuestAuth();
  const [name, setName] = useState("");
  const [lang, setLang] = useState<Lang>("en");

  if (!eventId) return <Navigate to="/" replace />;

  if (isAuthenticated && authEventId === eventId) {
    return <Navigate to={`/${eventId}`} replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    signIn(trimmed, eventId);
    navigate(`/${eventId}`, { replace: true });
  };

  const t = {
    en: {
      heading: "Welcome",
      subheading: "Please enter your name to continue",
      placeholder: "Your full name",
      buttonText: "Continue",
    },
    bm: {
      heading: "Selamat Datang",
      subheading: "Sila masukkan nama anda untuk meneruskan",
      placeholder: "Nama penuh anda",
      buttonText: "Teruskan",
    },
  }[lang];

  const containerStyle: CSSProperties = {
    backgroundColor: CREAM,
    color: TEXT,
    fontFamily: '"Cormorant Garamond", serif',
  };

  return (
    <div style={containerStyle} className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: GOLD }} />

      <div className="absolute top-6 right-6 flex gap-2">
        {(["en", "bm"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="px-3 py-1 text-xs tracking-wider uppercase transition-all"
            style={{
              fontFamily: '"Inter", sans-serif',
              color: lang === l ? CREAM : GOLD,
              backgroundColor: lang === l ? GOLD : "transparent",
              border: `1px solid ${GOLD}`,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2" style={{ width: "1px", backgroundColor: GOLD, opacity: 0.2 }} />

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="block h-px w-10" style={{ backgroundColor: GOLD }} />
          <span className="text-xs tracking-[0.3em] uppercase" style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}>
            Invitation
          </span>
          <span className="block h-px w-10" style={{ backgroundColor: GOLD }} />
        </div>

        <h2 className="text-3xl md:text-4xl mb-2" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT }}>
          {t.heading}
        </h2>
        <p className="text-base mb-8" style={{ fontFamily: '"Cormorant Garamond", serif', color: TEXT_MUTED }}>
          {t.subheading}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.placeholder}
            autoFocus
            style={{
              textAlign: "center",
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: "1.1rem",
              padding: "0.75rem 1rem",
              backgroundColor: CREAM,
              borderColor: BORDER,
              color: TEXT,
            }}
          />
          <Button
            type="submit"
            disabled={!name.trim()}
            className="w-full"
            style={{
              backgroundColor: GOLD,
              color: CREAM,
              fontFamily: '"Inter", sans-serif',
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              padding: "0.75rem 1.5rem",
              border: `1px solid ${GOLD}`,
            }}
          >
            {t.buttonText}
          </Button>
        </form>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <span className="block h-px w-16 mx-auto mb-3" style={{ backgroundColor: GOLD, opacity: 0.4 }} />
        <p className="text-xs tracking-[0.2em] uppercase" style={{ color: TEXT_MUTED, fontFamily: '"Inter", sans-serif' }}>
          With Love
        </p>
      </div>
    </div>
  );
}

export default RustyLogin;
