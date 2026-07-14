import React from "react";
import { cn } from "../../lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-primary tracking-tight">MyWedly</span>
        </a>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-dash-muted hover:text-dash-text transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-dash-muted hover:text-dash-text transition-colors">
            Pricing
          </a>
          <a href="#about" className="text-sm font-medium text-dash-muted hover:text-dash-text transition-colors">
            About
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-dash-primary text-dash-primary-fg text-sm font-medium hover:bg-dash-primary-hover transition-colors"
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}
