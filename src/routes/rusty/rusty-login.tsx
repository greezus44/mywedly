import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { type UserEvent, type SubEvent, type ScheduleItem } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_LOGIN_CONFIG, RUSTY_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ArrowRight, User } from "lucide-react";

export type Lang = "en" | "id";

interface OutletContext {
  event: UserEvent;
  subEvents: SubEvent[];
  schedule: ScheduleItem[];
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export default function RustyLogin() {
  const navigate = useNavigate();
  const { event } = useOutletContext<OutletContext>();
  const { signIn } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = { ...RUSTY_LOGIN_CONFIG, ...(event.login_config || {}) };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      signIn(trimmed, event.id);
      navigate(`./home`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        backgroundColor: config.bgColor || RUSTY_THEME.bgSubtleColor || "#FAF3E0",
        color: config.textColor || RUSTY_THEME.textColor || "#3D3528",
      }}
    >
      <div className="w-full max-w-md">
        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="w-20 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-20 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
        </div>

        <div className="text-center mb-10">
          <h1
            className="font-heading text-4xl md:text-5xl tracking-tight"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            {config.heading || "Welcome"}
          </h1>
          <p className="mt-4 text-sm italic opacity-70" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            {config.subheading || "Please enter your name to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.inputPlaceholder || "Your full name"}
              autoFocus
              className="pl-11 py-3 text-base"
              style={{
                backgroundColor: RUSTY_THEME.bgColor || "#F5ECD7",
                borderColor: RUSTY_THEME.borderColor || "#D4C695",
                borderRadius: 2,
              }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: "#9c2a2a" }}>{error}</p>}

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full justify-center uppercase tracking-[0.2em]"
            style={{
              backgroundColor: config.buttonColor || RUSTY_THEME.primaryColor || "#B8962E",
              color: RUSTY_THEME.bgColor || "#F5ECD7",
              borderRadius: 2,
            }}
          >
            {config.buttonText || "Continue"} <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="mt-10 text-center text-xs uppercase tracking-[0.2em] opacity-50">
          {event.name}
        </p>

        {/* Bottom divider */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <div className="w-20 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
          <div className="w-20 h-px" style={{ backgroundColor: RUSTY_THEME.primaryColor || "#B8962E" }} />
        </div>
      </div>
    </div>
  );
}
