import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RUSTY_LOGIN_CONFIG } from "../../lib/theme";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useGuestAuth } from "../../lib/guest-auth";
import { useRustyOutletContext } from "./rusty-layout";

export type Lang = "en" | "id";

/**
 * RustyLogin — guest login with cream/gold styling.
 */
export default function RustyLogin() {
  const { event } = useRustyOutletContext();
  const { signIn } = useGuestAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lc = { ...RUSTY_LOGIN_CONFIG, ...(event.login_config || {}) };
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };
  const scriptFont: React.CSSProperties = { fontFamily: "var(--event-font-script)" };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }
    setError(null);
    signIn(trimmed, event.id);
    navigate("home");
  };

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-6"
      style={{ backgroundColor: lc.bgColor || "var(--event-surface)", color: lc.textColor || "var(--event-text)" }}
    >
      {/* Decorative gold top border */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: "var(--event-primary)" }} />

      <div className="relative z-10 w-full max-w-md py-16">
        {lc.logo && (
          <img
            src={lc.logo}
            alt="logo"
            className="mx-auto mb-8"
            style={{ width: lc.logoWidth ? `${lc.logoWidth}px` : "72px" }}
          />
        )}

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-12" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="h-px w-12" style={{ backgroundColor: "var(--event-primary)" }} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2" style={headingFont}>{lc.heading || "Welcome"}</h1>
          {lc.subheading && (
            <p className="text-sm opacity-75" style={scriptFont}>{lc.subheading}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lc.inputPlaceholder || "Your full name"}
            className="text-center"
            style={{
              borderColor: "var(--event-border)",
              backgroundColor: "var(--event-bg)",
              color: "var(--event-text)",
              borderRadius: "var(--event-radius)",
            }}
            autoFocus
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{
              backgroundColor: lc.buttonColor || "var(--event-primary)",
              color: "#fff",
              borderRadius: "var(--event-radius)",
            }}
          >
            {lc.buttonText || "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="h-px w-12" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "var(--event-primary)" }} />
          <div className="h-px w-12" style={{ backgroundColor: "var(--event-primary)" }} />
        </div>
      </div>

      {/* Decorative gold bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: "var(--event-primary)" }} />
    </div>
  );
}
