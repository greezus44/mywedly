import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-dash-border bg-dash-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-bold text-dash-text">
          My<span className="text-dash-primary">Wedly</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm font-medium text-dash-muted hover:text-dash-text">Dashboard</Link>
          <Link to="/auth" className="text-sm font-medium text-dash-primary hover:underline">Sign In</Link>
        </nav>
      </div>
    </header>
  );
}
