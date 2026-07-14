import React from "react";
import { cn } from "../../lib/utils";

export interface SiteHeaderProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

export function SiteHeader({ className, onNavigate }: SiteHeaderProps) {
  const links = [
    { label: "Features", path: "/#features" },
    { label: "Pricing", path: "/#pricing" },
    { label: "Sign in", path: "/login" },
  ];

  function handleClick(e: React.MouseEvent, path: string) {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  }

  return (
    <header className={cn("sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur", className)}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a
          href="/"
          onClick={(e) => handleClick(e, "/")}
          className="flex items-center gap-2 text-lg font-bold text-dash-text"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </span>
          MyWedly
        </a>

        <nav className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <a
              key={link.path}
              href={link.path}
              onClick={(e) => handleClick(e, link.path)}
              className="text-sm font-medium text-dash-muted transition-colors hover:text-dash-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="sm:hidden">
          <a
            href="/login"
            onClick={(e) => handleClick(e, "/login")}
            className="rounded-lg bg-dash-primary px-3 py-1.5 text-sm font-medium text-dash-primary-fg"
          >
            Sign in
          </a>
        </div>
      </div>
    </header>
  );
}
