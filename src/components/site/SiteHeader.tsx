import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps): React.ReactElement {
  return (
    <header className={cn("sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur", className)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-text">
            My<span className="text-dash-primary">Wedly</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:text-dash-text hover:bg-dash-bg transition-colors"
          >
            Home
          </Link>
          <Link
            to="/templates"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:text-dash-text hover:bg-dash-bg transition-colors"
          >
            Templates
          </Link>
          <Link
            to="/pricing"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:text-dash-text hover:bg-dash-bg transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:text-dash-text hover:bg-dash-bg transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover transition-colors"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
