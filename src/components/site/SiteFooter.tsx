import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-dash-muted">
            © {new Date().getFullYear()} My<span className="text-dash-primary">Wedly</span>
          </p>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm text-dash-muted hover:text-dash-text">Home</Link>
            <Link to="/auth" className="text-sm text-dash-muted hover:text-dash-text">Sign In</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
