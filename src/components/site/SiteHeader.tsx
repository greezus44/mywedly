import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header className={cn("border-b border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg font-bold">
            M
          </span>
          <span className="text-lg font-bold text-dash-text">MyWedly</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/features" className="text-sm font-medium text-dash-muted hover:text-dash-text">
            Features
          </Link>
          <Link to="/templates" className="text-sm font-medium text-dash-muted hover:text-dash-text">
            Templates
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-dash-muted hover:text-dash-text">
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
