import React from "react";
import { cn } from "../../lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-dash-primary">MyWedly</span>
            <span className="text-xs text-dash-muted">© {new Date().getFullYear()}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-dash-muted">
            <a href="/about" className="hover:text-dash-text">About</a>
            <a href="/privacy" className="hover:text-dash-text">Privacy</a>
            <a href="/terms" className="hover:text-dash-text">Terms</a>
            <a href="/contact" className="hover:text-dash-text">Contact</a>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-dash-muted sm:text-left">
          Made with love for couples planning their special day.
        </p>
      </div>
    </footer>
  );
}
