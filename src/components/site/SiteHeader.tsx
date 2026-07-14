import React from "react";
import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-primary">MyWedly</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/features"
            className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
