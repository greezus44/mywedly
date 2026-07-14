import React from "react";
import { cn } from "../../lib/utils";

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-semibold text-dash-text">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-dash-primary text-dash-primary-fg">
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </span>
            MyWedly
          </div>

          <nav className="flex items-center gap-4 text-sm text-dash-muted">
            <a href="/#features" className="transition-colors hover:text-dash-text">Features</a>
            <a href="/#pricing" className="transition-colors hover:text-dash-text">Pricing</a>
            <a href="/login" className="transition-colors hover:text-dash-text">Sign in</a>
          </nav>

          <p className="text-sm text-dash-muted">
            © {year} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
