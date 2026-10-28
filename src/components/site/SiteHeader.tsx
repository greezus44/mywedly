import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDashTheme } from "../../lib/use-dark-mode";
import { useSession, signOut } from "../../lib/auth";

export function SiteHeader() {
  const { theme: dashTheme, toggle: toggleDashTheme } = useDashTheme();
  const { session } = useSession();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  };

  const email = session?.user?.email;
  const displayName = email ? email.split("@")[0] : null;

  return (
    <header className="border-b border-dash-border bg-dash-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" style={{ backgroundColor: "var(--dash-header-bg)" }}>
        <Link to="/" className="flex items-center gap-2">
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <button onClick={toggleDashTheme} className="rounded-lg border border-dash-border px-2.5 py-1.5 text-dash-text transition-colors hover:bg-dash-surface" aria-label="Toggle dark mode">{dashTheme === "dark" ? "☀" : "☾"}</button>
          <Link to="/dashboard" className="text-dash-muted hover:text-dash-text">Dashboard</Link>
          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-lg px-3 py-1.5 font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: "var(--dash-accent)", color: "var(--dash-accent-fg)" }}
              >
                {displayName}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-dash-border bg-dash-surface shadow-lg">
                    <div className="px-4 py-3 border-b border-dash-border" style={{ backgroundColor: "#f8ecd5" }}>
                      <p className="text-xs text-dash-muted">Signed in as</p>
                      <p className="text-sm font-medium text-dash-text truncate">{email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-3 text-left text-sm text-dash-text transition-colors hover:bg-dash-bg"
                      style={{ backgroundColor: "#f8ecd5" }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link to="/auth" className="rounded-lg px-3 py-1.5 font-medium hover:bg-dash-accent-hover" style={{ backgroundColor: "var(--dash-accent)", color: "var(--dash-accent-fg)" }}>Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
