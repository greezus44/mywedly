import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export function SiteHeader({
  className,
}: {
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-text">
            My<span className="text-dash-primary">Wedly</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-dash-text hover:text-dash-primary"
          >
            Home
          </Link>
          <Link
            to="/features"
            className="text-sm font-medium text-dash-text hover:text-dash-primary"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-dash-text hover:text-dash-primary"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
