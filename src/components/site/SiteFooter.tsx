import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export function SiteFooter({
  className,
}: {
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "border-t border-dash-border bg-dash-surface",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="text-sm text-dash-muted hover:text-dash-text"
            >
              Home
            </Link>
            <Link
              to="/features"
              className="text-sm text-dash-muted hover:text-dash-text"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-dash-muted hover:text-dash-text"
            >
              Pricing
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-dash-muted hover:text-dash-text"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-dash-muted hover:text-dash-text"
            >
              Terms
            </Link>
          </nav>
        </div>
        <div className="mt-6 border-t border-dash-border pt-4 text-center">
          <p className="text-sm text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
