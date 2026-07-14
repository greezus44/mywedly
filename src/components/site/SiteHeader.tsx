import React from "react";
import { cn } from "../../lib/utils";

export interface SiteHeaderProps {
  className?: string;
}

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-dash-border bg-dash-surface/80 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 15.5c-1.874 0-3.625.554-5 1.5m-9-1.5c1.874 0 3.625.554 5 1.5m4-1.5c-1.874 0-3.625.554-5 1.5m0 0V12m0 5.5v3.5m0-9V4m0 0C9.5 4 8 5.5 8 7.5S9.5 11 11 11s3-1.5 3-3.5S12.5 4 11 4z"
              />
            </svg>
          </span>
          <span className="text-lg font-bold text-dash-text">
            My<span className="text-dash-primary">Wedly</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg sm:inline-block"
          >
            Sign in
          </a>
          <a
            href="/register"
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
