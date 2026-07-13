import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg font-bold">
                M
              </span>
              <span className="text-lg font-bold text-dash-text">MyWedly</span>
            </div>
            <p className="mt-2 text-sm text-dash-muted">
              Beautiful wedding websites for your special day.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-dash-text">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-sm text-dash-muted hover:text-dash-text">Features</Link></li>
              <li><Link to="/templates" className="text-sm text-dash-muted hover:text-dash-text">Templates</Link></li>
              <li><Link to="/pricing" className="text-sm text-dash-muted hover:text-dash-text">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-dash-text">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-dash-muted hover:text-dash-text">About</Link></li>
              <li><Link to="/contact" className="text-sm text-dash-muted hover:text-dash-text">Contact</Link></li>
              <li><Link to="/blog" className="text-sm text-dash-muted hover:text-dash-text">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-dash-text">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm text-dash-muted hover:text-dash-text">Privacy</Link></li>
              <li><Link to="/terms" className="text-sm text-dash-muted hover:text-dash-text">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-dash-border pt-4 text-center text-sm text-dash-muted">
          © {new Date().getFullYear()} MyWedly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
