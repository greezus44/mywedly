import { type ReactNode } from "react";
import { Link } from "react-router-dom";

export interface SiteHeaderProps {
  navLinks?: { label: string; to: string }[];
  children?: ReactNode;
}

const DEFAULT_NAV_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Templates", to: "/#templates" },
  { label: "Pricing", to: "/#pricing" },
  { label: "Sign in", to: "/login" },
];

export function SiteHeader({ navLinks, children }: SiteHeaderProps) {
  const links = navLinks ?? DEFAULT_NAV_LINKS;
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-bold text-gray-900">
            MyWedly
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
          {children}
        </nav>
      </div>
    </header>
  );
}
