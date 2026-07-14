import React from "react";
import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-dash-primary">MyWedly</span>
            <span className="text-sm text-dash-muted">— Invitation Website Builder</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              to="/features"
              className="text-sm text-dash-muted hover:text-dash-text transition-colors"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-dash-muted hover:text-dash-text transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className="text-sm text-dash-muted hover:text-dash-text transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm text-dash-muted hover:text-dash-text transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
        <div className="mt-4 border-t border-dash-border pt-4 text-center">
          <p className="text-xs text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
