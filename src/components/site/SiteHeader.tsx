import React from "react";
import { Link } from "react-router-dom";

export const SiteHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-dash-text">
          <span className="text-dash-primary">My</span>Wedly
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-bg hover:text-dash-text"
          >
            Home
          </Link>
          <Link
            to="/features"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-bg hover:text-dash-text"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-bg hover:text-dash-text"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
};
