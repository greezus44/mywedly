import { useState, useEffect, CSSProperties } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { supabase, Wedding } from "../../lib/supabase";
import { useGuestAuth } from "../../lib/guest-auth";
import { useLang } from "../../lib/lang-context";
import { themeToCssVars, DEFAULT_THEME } from "../../lib/theme";
import { ErrorState } from "../../components/ui/index";

/**
 * GuestLayout — layout wrapper for all authenticated guest pages.
 *
 * It fetches the wedding by the `weddingId` available from guest auth (or the
 * `:weddingId` URL param as a fallback), applies the wedding's theme CSS vars
 * to a wrapper div, and renders the nested route via <Outlet /> with the
 * wedding object passed as route context.
 *
 * If the guest is not authenticated, it redirects to the cover page so they
 * can "open" the invitation and sign in.
 */
export default function GuestLayout() {
  const { weddingId: authWeddingId } = useGuestAuth();
  const { weddingId: paramWeddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();

  const weddingId = authWeddingId || paramWeddingId;

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No auth and no param — send to cover page for this wedding
    if (!weddingId) {
      if (paramWeddingId) navigate(`/${paramWeddingId}`, { replace: true });
      else navigate("/", { replace: true });
      return;
    }

    // If guest auth exists but is for a different wedding, redirect to cover
    if (authWeddingId && paramWeddingId && authWeddingId !== paramWeddingId) {
      navigate(`/${paramWeddingId}`, { replace: true });
      return;
    }

    // Require guest auth for the layout's nested pages
    if (!authWeddingId) {
      navigate(`/${weddingId}`, { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("weddings")
          .select("*")
          .eq("id", weddingId)
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) throw new Error("Wedding not found");

        setWedding(data as Wedding);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load wedding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weddingId, authWeddingId, paramWeddingId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--wed-bg, #faf8f5)" }}>
        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ background: "var(--wed-bg, #faf8f5)" }}>
        <ErrorState message={error || "Wedding not found"} onRetry={() => navigate(`/${weddingId}`, { replace: true })} />
      </div>
    );
  }

  const themeVars = themeToCssVars(wedding.theme || DEFAULT_THEME) as CSSProperties;

  return (
    <div
      className="min-h-screen"
      style={{
        ...themeVars,
        background: "var(--wed-bg)",
        color: "var(--wed-text)",
        fontFamily: "var(--wed-body-font)",
      }}
    >
      {/* Guest navigation bar */}
      <nav className="sticky top-0 z-30 backdrop-blur-sm" style={{ background: "color-mix(in srgb, var(--wed-bg) 90%, transparent)", borderBottom: "1px solid color-mix(in srgb, var(--wed-primary) 25%, transparent)" }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/${weddingId}/home`)}
            className="font-semibold text-sm truncate"
            style={{ fontFamily: "var(--wed-heading-font)", color: "var(--wed-heading-color)" }}
          >
            {wedding.groom_name} & {wedding.bride_name}
          </button>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <NavLink label={t("home")} onClick={() => navigate(`/${weddingId}/home`)} />
            <NavLink label={t("rsvp")} onClick={() => navigate(`/${weddingId}/rsvp`)} />
            {wedding.content?.doa_enabled && <NavLink label={t("doa")} onClick={() => navigate(`/${weddingId}/doa`)} />}
            {wedding.content?.message_enabled && <NavLink label={t("sendMessage")} onClick={() => navigate(`/${weddingId}/send-message`)} />}
            {wedding.content?.contact_enabled && <NavLink label={t("contact")} onClick={() => navigate(`/${weddingId}/contact`)} />}
          </div>
        </div>
      </nav>

      <Outlet context={{ wedding }} />

      {wedding.content?.footer_enabled && wedding.content?.footer_text && (
        <footer className="py-8 px-4 text-center text-sm" style={{ color: "var(--wed-body-color)", opacity: 0.7 }}>
          {wedding.content.footer_text}
        </footer>
      )}
    </div>
  );
}

function NavLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition-colors hover:opacity-80"
      style={{ color: "var(--wed-body-color)" }}
    >
      {label}
    </button>
  );
}
