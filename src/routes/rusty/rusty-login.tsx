import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, User } from "lucide-react";
import { supabase, type UserEvent } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { RUSTY_LOGIN_CONFIG } from "../../lib/theme";
import { useGuestAuth } from "../../lib/guest-auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export type Lang = "en" | "id";

async function fetchEventBySlug(slug: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`slug.eq.${slug},draft_slug.eq.${slug}`)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as UserEvent | null) ?? null;
}

export default function RustyLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signIn, eventId, guestName } = useGuestAuth();

  const { data: event, isLoading } = useQuery({
    queryKey: ["rusty-event", slug],
    queryFn: () => fetchEventBySlug(slug || ""),
    enabled: !!slug,
  });

  const [name, setName] = useState(guestName || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = { ...RUSTY_LOGIN_CONFIG, ...(event?.login_config || {}) };

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
        navigate(`/${slug || event.slug || event.id}/home`);
        return;
      }
      signIn(trimmed, event.id);
      navigate(`/${slug || event.slug || event.id}/home`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5ECD7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#B8962E]" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-6 py-16"
      style={{
        backgroundColor: login.bgColor || "#FAF3E0",
        color: login.textColor || "#3D3528",
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
              backgroundColor: login.overlayColor || "#3D3528",
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
          backgroundColor: login.bgImage
            ? "rgba(250, 243, 224, 0.92)"
            : "rgba(250, 243, 224, 0.6)",
          border: "1px solid #D4C695",
        }}
      >
        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mb-6" aria-hidden>
          <span className="block h-px w-10" style={{ backgroundColor: "#B8962E" }} />
          <span className="text-lg" style={{ color: "#B8962E" }}>❦</span>
          <span className="block h-px w-10" style={{ backgroundColor: "#B8962E" }} />
        </div>

        <h1
          className="font-heading text-4xl sm:text-5xl tracking-wide mb-3"
          style={{ color: login.textColor || "#3D3528" }}
        >
          {login.heading || "Welcome"}
        </h1>

        <p
          className="text-sm sm:text-base mb-8 max-w-xs"
          style={{ color: login.textColor || "#3D3528", opacity: 0.8 }}
        >
          {login.subheading || "Please enter your name to continue"}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative w-full">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "#B8962E" }}
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
                backgroundColor: "#FAF3E0",
                borderColor: "#D4C695",
                color: "#3D3528",
                borderRadius: 0,
              }}
            />
          </div>

          {error && (
            <p className="text-xs text-left" style={{ color: "#A07820" }}>
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
              backgroundColor: login.buttonColor || "#B8962E",
              color: "#FAF3E0",
              borderRadius: 0,
            }}
          >
            {login.buttonText || "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
