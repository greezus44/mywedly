import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={cn("sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur", className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-text">
            My<span className="text-dash-primary">Wedly</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors">
            Features
          </a>
          <a href="#templates" className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors">
            Templates
          </a>
          <a href="#pricing" className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors">
            FAQ
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="text-sm font-medium text-dash-text hover:text-dash-primary transition-colors"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover transition-colors"
          >
            Get started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden text-dash-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dash-border bg-dash-surface px-4 py-3 space-y-2">
          <a href="#features" className="block text-sm font-medium text-dash-text hover:text-dash-primary" onClick={() => setMobileOpen(false)}>
            Features
          </a>
          <a href="#templates" className="block text-sm font-medium text-dash-text hover:text-dash-primary" onClick={() => setMobileOpen(false)}>
            Templates
          </a>
          <a href="#pricing" className="block text-sm font-medium text-dash-text hover:text-dash-primary" onClick={() => setMobileOpen(false)}>
            Pricing
          </a>
          <a href="#faq" className="block text-sm font-medium text-dash-text hover:text-dash-primary" onClick={() => setMobileOpen(false)}>
            FAQ
          </a>
          <div className="flex gap-3 pt-2 border-t border-dash-border">
            <a href="/login" className="flex-1 text-center text-sm font-medium text-dash-text py-2">
              Sign in
            </a>
            <a href="/signup" className="flex-1 text-center rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg">
              Get started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
