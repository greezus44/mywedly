import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                My<span className="text-primary">Wedly</span>
              </span>
            </Link>
            <p className="mt-2 text-sm text-muted">
              Beautiful wedding websites for every couple.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              <li>
                <Link
                  to="/features"
                  className="text-sm text-muted hover:text-foreground"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-sm text-muted hover:text-foreground"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/templates"
                  className="text-sm text-muted hover:text-foreground"
                >
                  Templates
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-muted hover:text-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-muted hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-muted hover:text-foreground"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-muted hover:text-foreground"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-xs text-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
