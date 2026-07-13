import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGuestContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ArrowRight, User } from "lucide-react";

export default function GuestLogin() {
  const { event } = useGuestContext();
  const navigate = useNavigate();
  const { signIn } = useGuestAuth();
  const config = event.login_config || {};
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
    navigate(`./home`);
  };

  const bgStyle: React.CSSProperties = config.bgImage
    ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: config.bgColor || "var(--color-bg-subtle)" };

  const overlayStyle: React.CSSProperties = config.overlayColor
    ? { backgroundColor: config.overlayColor, opacity: config.overlayOpacity ?? 0.4 }
    : {};

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={bgStyle}>
      {config.overlayColor && <div className="absolute inset-0" style={overlayStyle} />}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-20 text-center" style={{ color: config.textColor || "var(--color-text)" }}>
        <div className="mb-8">
          <h1 className="font-[var(--font-heading)] text-3xl md:text-4xl mb-2">{config.heading || "Welcome"}</h1>
          {config.subheading && <p className="text-sm opacity-70">{config.subheading}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder={config.inputPlaceholder || "Your full name"}
              className="pl-11"
              autoFocus
              maxLength={100}
            />
          </div>
          {error && <p className="text-xs text-red-500 text-left">{error}</p>}
          <Button type="submit" size="lg" className="w-full" style={{ backgroundColor: config.buttonColor }}>
            {config.buttonText || "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="mt-8 text-xs opacity-50 uppercase tracking-wider">
          {event.name}
        </p>
      </div>
    </div>
  );
}
