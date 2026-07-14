import React, { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-primary">MyWedly</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/features" className="text-sm font-medium text-dash-text hover:text-dash-primary">
            Features
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-dash-text hover:text-dash-primary">
            Pricing
          </Link>
          <Link to="/examples" className="text-sm font-medium text-dash-text hover:text-dash-primary">
            Examples
          </Link>
          <Link to="/about" className="text-sm font-medium text-dash-text hover:text-dash-primary">
            About
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">
              Get started
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-dash-text md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-dash-border bg-dash-surface md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            <Link to="/features" className="rounded-lg px-3 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg" onClick={() => setMobileOpen(false)}>
              Features
            </Link>
            <Link to="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
            <Link to="/examples" className="rounded-lg px-3 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg" onClick={() => setMobileOpen(false)}>
              Examples
            </Link>
            <Link to="/about" className="rounded-lg px-3 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg" onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-dash-border pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
