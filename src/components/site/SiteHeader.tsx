import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="border-b border-dash-border bg-dash-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6" style={{ backgroundColor: "#f8ecd5" }}>
        <Link to="/" className="flex items-center gap-2">
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="text-dash-muted hover:text-dash-text">Dashboard</Link>
          <Link to="/auth" className="rounded-lg px-3 py-1.5 font-medium hover:bg-dash-primary-hover" style={{ backgroundColor: "#d2ae4b", color: "#030712" }}>Sign In</Link>
        </nav>
      </div>
    </header>
  );
}
