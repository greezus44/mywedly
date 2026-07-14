import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-dash-border bg-dash-surface/80 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-dash-text">
            My<span className="text-dash-primary">Wedly</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/features"
            className="rounded-lg px-3 py-2 text-sm font-medium text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
          >
            Features
          </Link>
          <Link
            to="/templates"
            className="rounded-lg px-3 py-2 text-sm font-medium text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
          >
            Templates
          </Link>
          <Link
            to="/pricing"
            className="rounded-lg px-3 py-2 text-sm font-medium text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
