import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">
            My<span className="text-primary">Wedly</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/features"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
