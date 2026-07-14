import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v6m3 0v6m3-6v6m3-6v6M3 21h18M3 10h18M3 7l9-4 9 4" />
            </svg>
          </div>
          <span className="text-xl font-bold text-dash-text">MyWedly</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/features"
            className="text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
          >
            Pricing
          </Link>
          <Link
            to="/templates"
            className="text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
          >
            Templates
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
