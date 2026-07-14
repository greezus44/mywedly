import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps): React.ReactElement {
  return (
    <footer className={cn("border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-dash-text">
                My<span className="text-dash-primary">Wedly</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-dash-muted">
              Beautiful invitation websites for weddings and events. Create, share, and manage your special day.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dash-text">Product</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/templates" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dash-text">Company</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-dash-border pt-6">
          <p className="text-center text-xs text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
