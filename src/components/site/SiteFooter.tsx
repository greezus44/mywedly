import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("w-full border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <span className="text-lg font-bold text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
            <p className="mt-2 text-sm text-dash-muted">
              Beautiful wedding websites for your special day.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-dash-text">Product</h4>
            <ul className="mt-2 space-y-1.5">
              <li><Link to="/features" className="text-sm text-dash-muted hover:text-dash-text">Features</Link></li>
              <li><Link to="/templates" className="text-sm text-dash-muted hover:text-dash-text">Templates</Link></li>
              <li><Link to="/pricing" className="text-sm text-dash-muted hover:text-dash-text">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-dash-text">Company</h4>
            <ul className="mt-2 space-y-1.5">
              <li><Link to="/about" className="text-sm text-dash-muted hover:text-dash-text">About</Link></li>
              <li><Link to="/contact" className="text-sm text-dash-muted hover:text-dash-text">Contact</Link></li>
              <li><Link to="/blog" className="text-sm text-dash-muted hover:text-dash-text">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-dash-text">Legal</h4>
            <ul className="mt-2 space-y-1.5">
              <li><Link to="/privacy" className="text-sm text-dash-muted hover:text-dash-text">Privacy</Link></li>
              <li><Link to="/terms" className="text-sm text-dash-muted hover:text-dash-text">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-dash-border pt-6 text-center">
          <p className="text-sm text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
