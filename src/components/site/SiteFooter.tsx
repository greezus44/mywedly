import React from "react";
import { cn } from "../../lib/utils";

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <span className="text-xl font-bold text-dash-primary">MyWedly</span>
            <p className="mt-2 text-sm text-dash-muted">
              Create beautiful invitation websites for your special day.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-dash-muted hover:text-dash-primary">Features</a></li>
              <li><a href="#pricing" className="text-sm text-dash-muted hover:text-dash-primary">Pricing</a></li>
              <li><a href="#templates" className="text-sm text-dash-muted hover:text-dash-primary">Templates</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Company</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-sm text-dash-muted hover:text-dash-primary">About</a></li>
              <li><a href="#contact" className="text-sm text-dash-muted hover:text-dash-primary">Contact</a></li>
              <li><a href="#faq" className="text-sm text-dash-muted hover:text-dash-primary">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#privacy" className="text-sm text-dash-muted hover:text-dash-primary">Privacy</a></li>
              <li><a href="#terms" className="text-sm text-dash-muted hover:text-dash-primary">Terms</a></li>
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
