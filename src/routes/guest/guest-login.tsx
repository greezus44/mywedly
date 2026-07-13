import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { getGuestSession, guestSignin } from "@/lib/guest-auth";
import { getTheme, themeToCssVars } from "@/lib/theme";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function GuestLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch wedding + check existing session ──
  useEffect(() => {
    if (!slug) return;

    // Redirect to home if already signed in
    const existing = getGuestSession();
    if (existing && existing.weddingSlug === slug) {
      navigate(`/w/${slug}/home`, { replace: true });
      return;
    }

    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setWedding((data as Wedding) ?? null);
        setLoading(false);
      });
  }, [slug, navigate]);

  const theme = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding || !username.trim()) return;

    setSubmitting(true);
    setError(null);

    const { error: signInError } = await guestSignin(wedding.id, username.trim(), slug!);

    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }

    navigate(`/w/${slug}/home`, { replace: true });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...cssVars, background: "var(--c-background)" }}
      >
        <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...cssVars, background: "var(--c-background)" }}
      >
        <div className="text-center px-6">
          <h1 className="text-3xl mb-2" style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}>
            Wedding Not Found
          </h1>
          <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
            We couldn't find the wedding you're looking for.
          </p>
        </div>
      </div>
    );
  }

  const coupleNames = `${wedding.couple_name_one} & ${wedding.couple_name_two}`;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ ...cssVars, background: "var(--c-background)" }}
    >
      {/* ── Decorative top accent ── */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="h-px w-12" style={{ background: "var(--c-accent)" }} />
        <div
          className="w-2 h-2 rounded-full rotate-45"
          style={{ background: "var(--c-accent)" }}
        />
        <div className="h-px w-12" style={{ background: "var(--c-accent)" }} />
      </div>

      {/* ── Header: couple names + date ── */}
      <div className="text-center mb-10 animate-slide-up">
        <h1
          className="leading-tight mb-3"
          style={{
            color: "var(--c-text)",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontFamily: "var(--f-heading)",
            fontStyle: "var(--f-style)",
          }}
        >
          {coupleNames}
        </h1>
        {wedding.wedding_date && (
          <div className="flex items-center justify-center gap-2" style={{ color: "var(--c-textMuted)" }}>
            <Calendar className="w-4 h-4" />
            <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
              {formatDate(wedding.wedding_date)}
            </span>
          </div>
        )}
      </div>

      {/* ── Login card ── */}
      <div
        className="w-full max-w-sm p-8 animate-scale-in"
        style={{
          background: "var(--c-card)",
          borderRadius: "var(--ui-radius)",
          boxShadow: "var(--ui-shadow)",
          border: "1px solid var(--c-secondary)",
        }}
      >
        <h2
          className="text-xl text-center mb-2"
          style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
        >
          Welcome
        </h2>
        <p
          className="text-sm text-center mb-6"
          style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
        >
          Please sign in with your username to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              autoComplete="username"
              disabled={submitting}
              style={{
                background: "var(--c-background)",
                borderColor: "var(--c-secondary)",
                color: "var(--c-text)",
                fontFamily: "var(--f-body)",
              }}
            />
          </div>

          {error && (
            <p
              className="text-sm text-center px-4 py-2.5 rounded-lg animate-fade-in"
              style={{
                color: "#c0392b",
                background: "rgba(192,57,43,0.08)",
                fontFamily: "var(--f-body)",
              }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting || !username.trim()}
            className="w-full"
            style={{
              background: "var(--c-button)",
              color: "var(--c-buttonText)",
              borderRadius: "var(--ui-radius)",
              fontFamily: "var(--f-body)",
            }}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        {/* ── Helper text ── */}
        {wedding.signin_helper && (
          <p
            className="text-xs text-center mt-5 pt-5"
            style={{
              color: "var(--c-textMuted)",
              fontFamily: "var(--f-body)",
              borderTop: "1px solid var(--c-secondary)",
              opacity: 0.8,
            }}
          >
            {typeof wedding.signin_helper === "string"
              ? wedding.signin_helper
              : "Contact the couple if you need help signing in."}
          </p>
        )}
      </div>

      {/* ── Back to cover link ── */}
      <button
        onClick={() => navigate(`/w/${slug}`)}
        className="mt-8 text-sm transition-opacity hover:opacity-70 animate-fade-in"
        style={{
          color: "var(--c-textMuted)",
          fontFamily: "var(--f-body)",
        }}
      >
        ← Back to cover
      </button>
    </div>
  );
}
