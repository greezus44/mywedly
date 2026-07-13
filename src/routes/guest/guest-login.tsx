import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Heart, LogIn } from "lucide-react";
import { supabase, type Wedding } from "@/lib/supabase";
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    // If already has a guest session for this wedding, redirect to home
    const session = getGuestSession();
    if (session && session.weddingSlug === slug) {
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

  // Extract signin helper text (can be string or object with hint field)
  const helperText = useMemo(() => {
    if (!wedding?.signin_helper) return null;
    if (typeof wedding.signin_helper === "string") return wedding.signin_helper;
    const obj = wedding.signin_helper as Record<string, unknown>;
    return (obj.hint as string) || (obj.text as string) || null;
  }, [wedding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding || !slug || !username.trim()) return;
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await guestSignin(wedding.id, username.trim(), slug);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate(`/w/${slug}/home`, { replace: true });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ ...cssVars, background: "var(--c-background)" } as React.CSSProperties}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[var(--c-textMuted)] border-t-[var(--c-primary)] rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-center px-6"
        style={{ ...cssVars, background: "var(--c-background)" } as React.CSSProperties}
      >
        <div>
          <h1
            className="font-serif text-3xl mb-3"
            style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
          >
            Wedding Not Found
          </h1>
          <p className="text-sm" style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}>
            The wedding you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ ...cssVars, background: "var(--c-background)" } as React.CSSProperties}
    >
      {/* ─── Background accent ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--c-accent)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--c-primary)" }}
        />
      </div>

      {/* ─── Header ─── */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Decorative ornament */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-12" style={{ background: "var(--c-accent)" }} />
            <Heart className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
            <div className="h-px w-12" style={{ background: "var(--c-accent)" }} />
          </div>

          {/* Couple names */}
          <h1
            className="font-script text-center mb-2"
            style={{
              color: "var(--c-text)",
              fontSize: "clamp(2rem, 6vw, 3rem)",
              fontFamily: "var(--f-heading)",
              fontStyle: "var(--f-style)",
            }}
          >
            {wedding.couple_name_one} & {wedding.couple_name_two}
          </h1>

          {/* Wedding date */}
          {wedding.wedding_date && (
            <div
              className="flex items-center justify-center gap-2 mb-8"
              style={{ color: "var(--c-textMuted)" }}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm" style={{ fontFamily: "var(--f-body)" }}>
                {formatDate(wedding.wedding_date)}
              </span>
            </div>
          )}

          {/* Sign-in card */}
          <div
            className="p-8 border"
            style={{
              background: "var(--c-card)",
              borderColor: "var(--c-secondary)",
              borderRadius: "var(--ui-radius)",
              boxShadow: "var(--ui-shadow)",
            }}
          >
            <h2
              className="font-serif text-xl text-center mb-1"
              style={{ color: "var(--c-text)", fontFamily: "var(--f-heading)" }}
            >
              Welcome
            </h2>
            <p
              className="text-sm text-center mb-6"
              style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
            >
              Sign in to view the wedding details
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
                  className={cn(
                    "border-[var(--c-secondary)] bg-[var(--c-card)] text-[var(--c-text)]",
                    "focus:border-[var(--c-primary)] focus:ring-[var(--c-primary)]/10",
                    "placeholder:text-[var(--c-textMuted)]/40"
                  )}
                  style={{
                    borderColor: "var(--c-secondary)",
                    background: "var(--c-card)",
                    color: "var(--c-text)",
                  }}
                />
              </div>

              {helperText && (
                <p
                  className="text-xs text-center px-3 py-2 rounded-lg"
                  style={{
                    color: "var(--c-textMuted)",
                    background: "var(--c-background)",
                    fontFamily: "var(--f-body)",
                  }}
                >
                  {helperText}
                </p>
              )}

              {error && (
                <p
                  className="text-xs text-center px-3 py-2 rounded-lg"
                  style={{
                    color: "#c53030",
                    background: "rgba(200,0,0,0.05)",
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
                <LogIn className="w-4 h-4" />
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </div>

          {/* Footer note */}
          <p
            className="text-xs text-center mt-6"
            style={{ color: "var(--c-textMuted)", fontFamily: "var(--f-body)" }}
          >
            Can't find your username? Contact the couple for help.
          </p>
        </div>
      </div>
    </div>
  );
}
