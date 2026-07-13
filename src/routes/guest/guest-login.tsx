import { useState, type CSSProperties } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { type UserEvent, type LoginConfig } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";

export default function GuestLoginPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const { signIn, guestName, eventId } = useGuestAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const cfg: LoginConfig = event.login_config ?? {};

  // If already signed in to this event, go home
  if (guestName && eventId === event.id) {
    navigate("home");
  }

  const bg: CSSProperties = cfg.bgImage
    ? { backgroundImage: `url(${cfg.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: cfg.bgColor || "#fafafa" };

  const overlay: CSSProperties = cfg.overlayColor
    ? { backgroundColor: cfg.overlayColor, opacity: cfg.overlayOpacity ?? 0.3 }
    : {};

  const textColor = cfg.textColor || "#1a1a1a";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    signIn(name.trim(), event.id);
    setTimeout(() => {
      navigate("home");
    }, 100);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center" style={bg}>
      <div className="absolute inset-0" style={overlay} />
      <div className="relative z-10 flex w-full max-w-xs flex-col items-center gap-3">
        {cfg.logo && (
          <img
            src={cfg.logo}
            alt="logo"
            style={{ width: cfg.logoWidth ? `${cfg.logoWidth}px` : undefined }}
            className="mb-2"
          />
        )}
        {cfg.heading && (
          <h2 style={{ color: textColor }} className="text-2xl font-semibold">
            {cfg.heading}
          </h2>
        )}
        {cfg.subheading && (
          <p style={{ color: textColor, opacity: 0.8 }} className="text-sm">
            {cfg.subheading}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-4 flex w-full flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={cfg.inputPlaceholder || "Your full name"}
            required
            autoFocus
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{ backgroundColor: cfg.buttonColor || "#1a1a1a", color: "#fff" }}
            className="w-full rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : cfg.buttonText || "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
