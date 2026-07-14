import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Templates", href: "/#templates" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <header className={cn("sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur", className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-primary">MyWedly</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/auth"
            className="rounded-lg px-4 py-2 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg"
          >
            Sign In
          </Link>
          <Link
            to="/auth?mode=signup"
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 text-dash-text md:hidden"
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

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-dash-border px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-dash-text"
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-dash-primary px-4 py-2 text-center text-sm font-medium text-dash-primary-fg"
            >
              Get Started
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export default SiteHeader;
