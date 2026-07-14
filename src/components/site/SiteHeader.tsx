import React from "react";
import { cn } from "../../lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header className={cn("border-b border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-primary">MyWedly</span>
        </a>
        <nav className="flex items-center gap-6 text-sm">
          <a href="/#features" className="text-dash-muted hover:text-dash-text">Features</a>
          <a href="/#templates" className="text-dash-muted hover:text-dash-text">Templates</a>
          <a href="/#pricing" className="text-dash-muted hover:text-dash-text">Pricing</a>
          <a
            href="/login"
            className="rounded-md bg-dash-primary px-4 py-2 font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
          >
            Sign in
          </a>
        </nav>
      </div>
    </header>
  );
}
