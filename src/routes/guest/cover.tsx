import { useState, useEffect, CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase, Wedding } from "../../lib/supabase";
import { useLang } from "../../lib/lang-context";
import { coverToCssVars, DEFAULT_COVER_CONFIG } from "../../lib/theme";
import { cn, formatDate, getCountdown } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/index";

/**
 * GuestCover — the full-screen cover page shown at `/:weddingId`.
 *
 * Displays the couple's names, wedding date, and a live countdown timer.
 * The "Open Invitation" button navigates to the guest login page.
 */
export default function GuestCover() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(() => getCountdown(null));

  useEffect(() => {
    if (!weddingId) {
      setError("No wedding specified");
      setLoading(false);
      return;
    }

    let cancelled = false;

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
  }, [weddingId]);

  // Live countdown ticker
  useEffect(() => {
    if (!wedding?.wedding_date) return;
    setCountdown(getCountdown(wedding.wedding_date));
    const interval = setInterval(() => {
      setCountdown(getCountdown(wedding.wedding_date));
    }, 1000);
    return () => clearInterval(interval);
  }, [wedding?.wedding_date]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
        <ErrorState message={error || "Wedding not found"} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const cover = wedding.cover_config || DEFAULT_COVER_CONFIG;
  const coverVars = coverToCssVars(cover) as CSSProperties;

  const showDate = cover.showDate && wedding.wedding_date;
  const showCountdown = cover.showCountdown && wedding.wedding_date && !countdown.expired;

  const handleOpen = () => {
    if (weddingId) navigate(`/${weddingId}/login`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        ...coverVars,
        background: cover.bgImage ? `linear-gradient(rgba(0,0,0,${cover.overlayOpacity}), rgba(0,0,0,${cover.overlayOpacity})), var(--wed-cover-image)` : cover.bgColor,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "var(--wed-cover-text)",
      }}
    >
      {/* Optional custom text above names */}
      {cover.customText && (
        <p
          className="mb-6 text-sm uppercase tracking-[0.3em] opacity-80 animate-fade-in"
          style={{ fontFamily: "var(--wed-cover-font)" }}
        >
          {cover.customText}
        </p>
      )}

      {/* Couple names */}
      <div className="text-center px-6 animate-fade-in animation-delay-200">
        <p className="text-xs uppercase tracking-[0.4em] mb-6 opacity-70" style={{ fontFamily: "var(--wed-cover-font)" }}>
          {t("saveTheDate")}
        </p>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
          style={{ fontFamily: "var(--wed-cover-script-font)", fontWeight: 400 }}
        >
          {wedding.groom_name}
        </h1>
        <p className="my-2 text-lg opacity-60" style={{ fontFamily: "var(--wed-cover-font)" }}>&</p>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight"
          style={{ fontFamily: "var(--wed-cover-script-font)", fontWeight: 400 }}
        >
          {wedding.bride_name}
        </h1>
      </div>

      {/* Date */}
      {showDate && (
        <div className="mt-10 text-center animate-fade-in animation-delay-500">
          <p className="text-base sm:text-lg opacity-90" style={{ fontFamily: "var(--wed-cover-font)" }}>
            {formatDate(wedding.wedding_date)}
          </p>
          {wedding.wedding_time && (
            <p className="text-sm mt-1 opacity-70" style={{ fontFamily: "var(--wed-cover-font)" }}>
              {wedding.venue}
            </p>
          )}
        </div>
      )}

      {/* Countdown */}
      {showCountdown && (
        <div className="mt-10 flex items-center justify-center gap-4 sm:gap-8 animate-fade-in animation-delay-700">
          <CountdownUnit value={countdown.days} label={t("days")} />
          <CountdownSep />
          <CountdownUnit value={countdown.hours} label={t("hours")} />
          <CountdownSep />
          <CountdownUnit value={countdown.minutes} label={t("minutes")} />
          <CountdownSep />
          <CountdownUnit value={countdown.seconds} label={t("seconds")} />
        </div>
      )}

      {/* Open Invitation button */}
      <div className="mt-12 animate-fade-in animation-delay-1000">
        <Button
          onClick={handleOpen}
          size="lg"
          className="px-8 py-3 text-sm uppercase tracking-[0.2em] font-medium border-0"
          style={{
            background: cover.buttonColor,
            color: cover.textColor,
            borderRadius: "2px",
          }}
        >
          {cover.buttonText || t("enterInvitation")}
        </Button>
      </div>

      {/* Parents */}
      {(wedding.groom_parents || wedding.bride_parents) && (
        <div className="mt-16 text-center text-xs opacity-50 animate-fade-in animation-delay-1200" style={{ fontFamily: "var(--wed-cover-font)" }}>
          {wedding.groom_parents && <p>{wedding.groom_parents}</p>}
          {wedding.bride_parents && <p>{wedding.bride_parents}</p>}
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-light tabular-nums" style={{ fontFamily: "var(--wed-cover-font)" }}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mt-1">{label}</div>
    </div>
  );
}

function CountdownSep() {
  return <div className="text-2xl opacity-30 -mt-4">:</div>;
}
