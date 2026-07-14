import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Templates", href: "/#templates" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-dash-primary">MyWedly</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-dash-text transition-colors hover:bg-dash-bg"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md p-2 text-dash-text md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      <div className={cn("border-t border-dash-border md:hidden", open ? "block" : "hidden")}>
        <nav className="flex flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-dash-muted hover:bg-dash-bg hover:text-dash-text"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-dash-border pt-3">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md border border-dash-border px-4 py-2 text-center text-sm font-medium text-dash-text hover:bg-dash-bg"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-md bg-dash-primary px-4 py-2 text-center text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
