import { Link } from "react-router-dom";
import { useDashTheme } from "../../lib/use-dark-mode";

export function SiteHeader() {
  const { theme: dashTheme, toggle: toggleDashTheme } = useDashTheme();
  return (
    <header className="border-b border-dash-border bg-dash-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" style={{ backgroundColor: "var(--dash-header-bg)" }}>
        <Link to="/" className="flex items-center gap-2">
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <button onClick={toggleDashTheme} className="rounded-lg border border-dash-border px-2.5 py-1.5 text-dash-text transition-colors hover:bg-dash-surface" aria-label="Toggle dark mode">{dashTheme === "dark" ? "☀" : "☾"}</button>
          <Link to="/dashboard" className="text-dash-muted hover:text-dash-text">Dashboard</Link>
          <Link to="/auth" className="rounded-lg px-3 py-1.5 font-medium hover:bg-dash-accent-hover" style={{ backgroundColor: "var(--dash-accent)", color: "var(--dash-accent-fg)" }}>Sign In</Link>
        </nav>
      </div>
    </header>
  );
}
