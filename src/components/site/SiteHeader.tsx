import React, { useState } from "react";
import { cn } from "../../lib/utils";

export interface SiteHeaderProps {
  className?: string;
}

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const SiteHeader: React.FC<SiteHeaderProps> = ({ className }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className={cn("sticky top-0 z-40 w-full border-b border-dash-border bg-dash-surface/80 backdrop-blur", className)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-2 text-lg font-bold text-dash-text">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.5c0-.9-.4-1.7-1-2.3V8a3 3 0 00-3-3h-1V3h-2v2h-4V3H8v2H7a3 3 0 00-3 3v5.2c-.6.6-1 1.4-1 2.3v4a1 1 0 001 1h1v2h2v-2h10v2h2v-2h1a1 1 0 001-1v-4z" />
            </svg>
          </span>
          MyWedly
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
          >
            Start building
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md p-2 text-dash-text md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-dash-border bg-dash-surface md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-bg hover:text-dash-text"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-dash-border pt-3">
              <a
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg"
              >
                Sign in
              </a>
              <a
                href="/signup"
                className="rounded-md bg-dash-primary px-4 py-2 text-center text-sm font-medium text-dash-primary-fg"
              >
                Start building
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
