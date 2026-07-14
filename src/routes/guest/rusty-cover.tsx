import { useParams, useNavigate } from "react-router-dom";
import { EventThemeProvider } from "../../lib/theme-context";
import { RUSTY_THEME } from "../../lib/theme";

export default function RustyCover() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  return (
    <EventThemeProvider theme={RUSTY_THEME as unknown as import("../../lib/supabase").Json}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 py-16 text-center animate-fadeIn">
          {/* Transparent logo placeholder */}
          <div className="mb-8">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" style={{ background: "transparent" }}>
              <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" opacity="0.4" style={{ color: "var(--event-heading)" }} />
              <text x="50" y="56" textAnchor="middle" fontSize="14" fill="currentColor" style={{ color: "var(--event-heading)" }} opacity="0.6">
                LOGO
              </text>
            </svg>
          </div>

          <p className="guest-eyebrow mb-2" style={{ color: "var(--event-accent)" }}>
            You are invited
          </p>
          <h1 className="guest-title mb-3" style={{ color: "var(--event-heading)" }}>
            MyWedly
          </h1>
          <p className="guest-subtitle mb-8" style={{ color: "var(--event-muted)" }}>
            Join us to celebrate
          </p>

          <button
            onClick={() => navigate(`/r/${slug}/signin`)}
            className="event-btn-primary"
          >
            Enter
          </button>
        </div>
      </div>
    </EventThemeProvider>
  );
}
