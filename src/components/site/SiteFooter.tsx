import React from "react";
import { cn } from "../../lib/utils";

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
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
            <span className="text-lg font-bold text-dash-primary">MyWedly</span>
            <span className="text-sm text-dash-muted">
              © {new Date().getFullYear()} MyWedly. All rights reserved.
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/privacy" className="text-sm text-dash-muted hover:text-dash-text">
              Privacy
            </a>
            <a href="/terms" className="text-sm text-dash-muted hover:text-dash-text">
              Terms
            </a>
            <a href="/contact" className="text-sm text-dash-muted hover:text-dash-text">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
