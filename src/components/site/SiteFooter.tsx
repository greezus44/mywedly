import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v6m3 0v6m3-6v6m3-6v6M3 21h18M3 10h18M3 7l9-4 9 4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-dash-text">MyWedly</span>
            </div>
            <p className="mt-3 text-sm text-dash-muted">
              Beautiful event websites for your special day.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-dash-muted transition-colors hover:text-dash-text">
                  Cookie Policy
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
