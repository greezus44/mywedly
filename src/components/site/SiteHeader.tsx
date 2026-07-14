import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="border-b border-dash-border bg-dash-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-dash-text">MyWedly</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/dashboard" className="text-dash-muted hover:text-dash-text">Dashboard</Link>
          <Link to="/auth" className="rounded-lg bg-dash-primary px-3 py-1.5 font-medium text-dash-primary-fg hover:bg-dash-primary-hover">Sign In</Link>
        </nav>
      </div>
    </header>
  );
}
