import { useState, type FormEvent } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { User } from "lucide-react";
import { type UserEvent, type LoginConfig } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { DEFAULT_THEME } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const DEFAULT_LOGIN_CONFIG: LoginConfig = {
  bgColor: DEFAULT_THEME.bgSubtleColor,
  textColor: DEFAULT_THEME.textColor,
  buttonColor: DEFAULT_THEME.primaryColor,
  buttonText: "Continue",
  heading: "Welcome",
  subheading: "Please enter your name to continue",
  inputPlaceholder: "Your full name",
};

export default function GuestLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const { signIn, eventId, guestName } = useGuestAuth();

  const login: LoginConfig = { ...DEFAULT_LOGIN_CONFIG, ...(event?.login_config || {}) };

  const [name, setName] = useState(guestName || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSlug = slug || event?.slug || event?.id || "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    if (!event) {
      setError("Event not loaded yet. Please try again.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      // If guest is already authenticated for this event, skip re-signing.
      if (eventId === event.id && guestName === trimmed) {
        navigate(`/e/${eventSlug}/home`);
        return;
      }
      signIn(trimmed, event.id);
      navigate(`/e/${eventSlug}/home`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-6 py-16"
      style={{
        backgroundColor: login.bgColor || DEFAULT_THEME.bgSubtleColor,
        color: login.textColor || DEFAULT_THEME.textColor,
      }}
    >
      {/* Background image with overlay */}
      {login.bgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${login.bgImage})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: login.overlayColor || "#1a1a1a",
              opacity: login.overlayOpacity ?? 0.4,
            }}
            aria-hidden
          />
        </>
      )}

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md flex flex-col items-center text-center px-8 py-12 animate-fade-in-up"
        style={{
          backgroundColor: login.bgImage ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.6)",
          border: `1px solid ${DEFAULT_THEME.borderColor}`,
        }}
      >
        <h1
          className="font-heading text-4xl sm:text-5xl tracking-wide mb-3"
          style={{ color: login.textColor || DEFAULT_THEME.textColor }}
        >
          {login.heading || "Welcome"}
        </h1>

        <p
          className="text-sm sm:text-base mb-8 max-w-xs"
          style={{ color: login.textColor || DEFAULT_THEME.textColor, opacity: 0.75 }}
        >
          {login.subheading || "Please enter your name to continue"}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative w-full">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: login.buttonColor || DEFAULT_THEME.primaryColor }}
            />
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={login.inputPlaceholder || "Your full name"}
              autoFocus
              autoComplete="name"
              className={cn("pl-10")}
              style={{
                backgroundColor: DEFAULT_THEME.bgColor,
                borderColor: DEFAULT_THEME.borderColor,
                color: DEFAULT_THEME.textColor,
                borderRadius: "var(--radius)",
              }}
            />
          </div>

          {error && (
            <p
              className="text-xs text-left"
              style={{ color: "var(--color-error, #dc2626)" }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            loading={submitting}
            disabled={submitting}
            className={cn("mt-2 w-full uppercase tracking-[0.25em]")}
            style={{
              backgroundColor: login.buttonColor || DEFAULT_THEME.primaryColor,
              color: DEFAULT_THEME.bgColor,
              borderRadius: "var(--radius)",
            }}
          >
            {login.buttonText || "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
