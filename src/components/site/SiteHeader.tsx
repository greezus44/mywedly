import React from "react";
import { cn } from "../../lib/utils";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-primary">MyWedly</span>
        </a>
        <nav className="flex items-center gap-4">
          <a
            href="#features"
            className="text-sm font-medium text-dash-muted hover:text-dash-text"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-dash-muted hover:text-dash-text"
          >
            Pricing
          </a>
          <a
            href="/login"
            className="text-sm font-medium text-dash-text hover:text-dash-primary"
          >
            Sign in
          </a>
          <a
            href="/register"
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
          >
            Get started
          </a>
        </nav>
      </div>
    </header>
  );
}
