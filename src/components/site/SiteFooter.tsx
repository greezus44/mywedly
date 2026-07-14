import React from "react";
import { cn } from "../../lib/utils";

export interface SiteFooterProps {
  className?: string;
}

const FOOTER_SECTIONS: {
  title: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Templates", href: "#templates" },
      { label: "Pricing", href: "#pricing" },
      { label: "Examples", href: "#examples" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Contact", href: "#contact" },
      { label: "Careers", href: "#careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#help" },
      { label: "FAQ", href: "#faq" },
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
    ],
  },
];

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "w-full border-t border-dash-border bg-dash-surface",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
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
            <p className="mt-3 max-w-xs text-sm text-dash-muted">
              Create a beautiful wedding invitation website in minutes. Share
              your special day with guests effortlessly.
            </p>
          </div>

          {/* Link sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-dash-text">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-dash-muted transition-colors hover:text-dash-text"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-dash-border pt-6 sm:flex-row">
          <p className="text-sm text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#privacy"
              className="text-sm text-dash-muted transition-colors hover:text-dash-text"
            >
              Privacy
            </a>
            <a
              href="#terms"
              className="text-sm text-dash-muted transition-colors hover:text-dash-text"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
