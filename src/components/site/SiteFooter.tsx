import React from "react";
import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-dash-primary">MyWedly</span>
            </div>
            <p className="mt-2 text-sm text-dash-muted">
              Beautiful invitation websites for your special events.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-dash-text">Product</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/features" className="text-sm text-dash-muted hover:text-dash-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-dash-muted hover:text-dash-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/examples" className="text-sm text-dash-muted hover:text-dash-primary">
                  Examples
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-dash-text">Company</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-dash-muted hover:text-dash-primary">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-dash-muted hover:text-dash-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-dash-muted hover:text-dash-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-dash-text">Legal</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-dash-muted hover:text-dash-primary">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-dash-muted hover:text-dash-primary">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-dash-border pt-6">
          <p className="text-center text-sm text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
