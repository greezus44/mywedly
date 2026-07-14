import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "w-full border-t border-dash-border bg-dash-surface",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-dash-text">
                My<span className="text-dash-primary">Wedly</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-dash-muted">
              Beautiful wedding websites for your special day.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-sm text-dash-muted hover:text-dash-text">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-sm text-dash-muted hover:text-dash-text">
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-dash-muted hover:text-dash-text">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-dash-muted hover:text-dash-text">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-dash-muted hover:text-dash-text">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-dash-muted hover:text-dash-text">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-dash-muted hover:text-dash-text">
                  About
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-dash-muted hover:text-dash-text">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-dash-muted hover:text-dash-text">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-dash-border pt-6">
          <p className="text-center text-sm text-dash-muted">
            &copy; {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
