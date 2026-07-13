import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-40 w-full border-b border-dash-border bg-dash-surface/95 backdrop-blur", className)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-dash-text">
            My<span className="text-dash-primary">Wedly</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/features" className="text-sm font-medium text-dash-muted hover:text-dash-text transition-colors">
            Features
          </Link>
          <Link to="/templates" className="text-sm font-medium text-dash-muted hover:text-dash-text transition-colors">
            Templates
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-dash-muted hover:text-dash-text transition-colors">
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-semibold text-dash-primary-fg hover:bg-dash-primary-hover transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
