import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { themeToCssVars, RUSTY_THEME, RUSTY_LOGIN_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { CSSProperties, FormEvent } from "react";

export async function fetchLoginEvent(eventId: string): Promise<UserEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data as UserEvent | null;
}

export default function RustyLogin() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { signIn, isAuthenticated, eventId: authEventId } = useGuestAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const { data: event, isLoading } = useQuery<UserEvent | null, Error>({
    queryKey: ["public-event", eventId],
    queryFn: () => fetchLoginEvent(eventId!),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (isAuthenticated && eventId && authEventId === eventId) {
      navigate(`/${eventId}`, { replace: true });
    }
  }, [isAuthenticated, authEventId, eventId, navigate]);

  const theme = event?.theme || event?.draft_theme || RUSTY_THEME;
  const cssVars = themeToCssVars(theme) as CSSProperties;
  const config = event?.login_config || event?.draft_login_config || RUSTY_LOGIN_CONFIG;
  const eventName = event?.draft_name || event?.name || "";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) return;
    setSubmitting(true);
    signIn(name.trim(), eventId);
    setTimeout(() => {
      navigate(`/${eventId}`, { replace: true });
    }, 100);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: config.bgColor || "#FAF3E0" }}
      >
        <div className="w-10 h-10 border-2 border-[#B8962E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      style={{ ...cssVars, backgroundColor: config.bgColor || "#FAF3E0" }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-6"
    >
      <div className="absolute left-6 top-0 bottom-0 w-px" style={{ backgroundColor: "#B8962E", opacity: 0.3 }} />
      <div className="absolute right-6 top-0 bottom-0 w-px" style={{ backgroundColor: "#B8962E", opacity: 0.3 }} />

      <div className="absolute top-6 right-8 flex items-center gap-1 text-xs">
        {(["EN", "BM"] as const).map((l) => (
          <span
            key={l}
            className="px-2 py-0.5 font-medium tracking-wider"
            style={{
              color: l === "EN" ? "#B8962E" : "#8B7355",
              opacity: l === "EN" ? 1 : 0.5,
            }}
          >
            {l}
          </span>
        ))}
      </div>

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
            <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "#B8962E" }} />
            <div className="h-px w-12" style={{ backgroundColor: "#B8962E" }} />
          </div>

          {eventName && (
            <p
              className="font-serif italic text-lg mb-2"
              style={{ color: "#8B7355", fontFamily: '"Cormorant Garamond", serif' }}
            >
              {eventName}
            </p>
          )}

          {config.heading && (
            <h1
              className="font-serif text-4xl md:text-5xl font-light mb-3"
              style={{
                color: config.textColor || "#3D3528",
                fontFamily: '"Cormorant Garamond", serif',
              }}
            >
              {config.heading}
            </h1>
          )}

          {config.subheading && (
            <p
              className="text-sm tracking-wide"
              style={{ color: "#8B7355" }}
            >
              {config.subheading}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.inputPlaceholder || "Your full name"}
              required
              autoFocus
              className="text-center font-serif text-lg py-3.5 border-[#D4C695] bg-white/60 focus:border-[#B8962E] focus:ring-[#B8962E]/20"
              style={{ color: "#3D3528" }}
            />
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || submitting}
            loading={submitting}
            className="w-full py-3.5 font-serif text-lg tracking-[0.2em] uppercase"
            style={{
              backgroundColor: config.buttonColor || "#B8962E",
              color: "#FAF3E0",
              border: `1px solid ${config.buttonColor || "#B8962E"}`,
            }}
          >
            {config.buttonText || "Continue"}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-4 mt-10">
          <div className="h-px w-16" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
          <div className="h-px w-16" style={{ backgroundColor: "#B8962E", opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}
