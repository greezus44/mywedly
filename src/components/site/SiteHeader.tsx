import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={cn("sticky top-0 z-40 bg-dash-surface/80 backdrop-blur border-b border-dash-border", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-lg font-bold text-dash-text">
            <span className="text-dash-primary">My</span>Wedly
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
              Pricing
            </a>
            <a href="#templates" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
              Templates
            </a>
            <a href="#faq" className="text-sm text-dash-muted hover:text-dash-text transition-colors">
              FAQ
            </a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="px-4 py-2 text-sm font-medium rounded-md bg-dash-primary text-dash-primary-fg hover:bg-dash-primary-hover transition-colors"
            >
              Get Started
            </a>
          </div>
          <button
            type="button"
            className="md:hidden p-2 text-dash-text"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-dash-border bg-dash-surface">
          <nav className="flex flex-col px-4 py-3 gap-3">
            <a href="#features" className="text-sm text-dash-muted hover:text-dash-text" onClick={() => setMobileOpen(false)}>
              Features
            </a>
            <a href="#pricing" className="text-sm text-dash-muted hover:text-dash-text" onClick={() => setMobileOpen(false)}>
              Pricing
            </a>
            <a href="#templates" className="text-sm text-dash-muted hover:text-dash-text" onClick={() => setMobileOpen(false)}>
              Templates
            </a>
            <a href="#faq" className="text-sm text-dash-muted hover:text-dash-text" onClick={() => setMobileOpen(false)}>
              FAQ
            </a>
            <div className="flex gap-3 pt-2 border-t border-dash-border">
              <a href="/login" className="flex-1 text-center text-sm font-medium text-dash-text py-2">
                Sign In
              </a>
              <a href="/signup" className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-md bg-dash-primary text-dash-primary-fg">
                Get Started
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
