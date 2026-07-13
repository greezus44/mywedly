import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRustyContext } from "./rusty-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { RUSTY_LOGIN_CONFIG, RUSTY_THEME } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ArrowRight, User } from "lucide-react";

export type Lang = "en" | "id";

export default function RustyLogin() {
  const { event } = useRustyContext();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const config = { ...RUSTY_LOGIN_CONFIG, ...(event.login_config || {}) };
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    signIn(trimmed, event.id);
    navigate("./home");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: config.bgColor || RUSTY_THEME.bgSubtleColor! }}>
      {/* Gold ornamental border */}
      <div className="absolute inset-4 border pointer-events-none" style={{ borderColor: RUSTY_THEME.accentColor, borderRadius: "2px" }} />

      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-20 text-center" style={{ color: config.textColor || RUSTY_THEME.textColor! }}>
        {/* Ornamental divider top */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="h-px w-12" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
        </div>

        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl mb-2" style={{ fontFamily: RUSTY_THEME.headingFont, color: RUSTY_THEME.textColor }}>
            {config.heading || "Welcome"}
          </h1>
          {config.subheading && <p className="text-sm opacity-70 italic font-serif" style={{ fontFamily: RUSTY_THEME.scriptFont }}>{config.subheading}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" style={{ color: RUSTY_THEME.accentColor! }} />
            <Input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder={config.inputPlaceholder || "Your full name"}
              className="pl-11"
              style={{ backgroundColor: "#F5ECD7", borderColor: RUSTY_THEME.borderColor, color: RUSTY_THEME.textColor, borderRadius: "2px" }}
              autoFocus
              maxLength={100}
            />
          </div>
          {error && <p className="text-xs text-red-500 text-left">{error}</p>}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            style={{ backgroundColor: config.buttonColor || RUSTY_THEME.accentColor!, color: "#F5ECD7", borderRadius: "2px" }}
          >
            {config.buttonText || "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="mt-8 text-xs opacity-50 uppercase tracking-wider font-serif" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.accentColor }}>
          {event.name}
        </p>

        {/* Ornamental divider bottom */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="h-px w-12" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
          <div className="h-px w-12" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
        </div>
      </div>
    </div>
  );
}
