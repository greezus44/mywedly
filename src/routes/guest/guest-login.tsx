import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useGuestAuth } from "../../lib/guest-auth";
import { useGuestOutletContext } from "./guest-layout";

/**
 * GuestLogin — guest name entry. Stores the guest name + event id in
 * guest-auth and navigates to the home page.
 */
export default function GuestLogin() {
  const { event } = useGuestOutletContext();
  const { signIn } = useGuestAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const lc = event.login_config || {};
  const bgStyle: React.CSSProperties = {};
  if (lc.bgImage) {
    bgStyle.backgroundImage = `url(${lc.bgImage})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  } else if (lc.bgColor) {
    bgStyle.backgroundColor = lc.bgColor;
  } else {
    bgStyle.backgroundColor = "var(--event-surface)";
  }
  const overlay = lc.overlayColor
    ? { backgroundColor: lc.overlayColor, opacity: lc.overlayOpacity ?? 0.3 }
    : undefined;
  const textColor = lc.textColor || "var(--event-text)";
  const buttonColor = lc.buttonColor || "var(--event-primary)";
  const headingFont: React.CSSProperties = { fontFamily: "var(--event-font-heading)" };

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
    <div className="min-h-screen relative flex items-center justify-center px-6" style={bgStyle}>
      {overlay && <div className="absolute inset-0" style={overlay} />}
      <div className="relative z-10 w-full max-w-md py-16" style={{ color: textColor }}>
        {lc.logo && (
          <img
            src={lc.logo}
            alt="logo"
            className="mx-auto mb-8"
            style={{ width: lc.logoWidth ? `${lc.logoWidth}px` : "64px" }}
          />
        )}
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2" style={headingFont}>{lc.heading || "Welcome"}</h1>
          {lc.subheading && <p className="text-sm opacity-75">{lc.subheading}</p>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={lc.inputPlaceholder || "Your full name"}
            className="text-center"
            autoFocus
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: buttonColor, color: "#fff", borderRadius: "var(--event-radius)" }}
          >
            {lc.buttonText || "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
