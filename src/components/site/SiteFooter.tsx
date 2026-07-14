import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SiteFooterProps {
  className?: string;
}

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Templates", href: "/#templates" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Examples", href: "/#examples" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "FAQ", href: "/#faq" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-dash-primary">MyWedly</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-dash-muted">
              Beautiful invitation websites for your special day. Create, share,
              and celebrate with ease.
            </p>
          </div>

          {/* Link sections */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-dash-text">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-dash-muted transition-colors hover:text-dash-primary"
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
          <p className="text-xs text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-xs text-dash-muted hover:text-dash-primary">
              Privacy
            </a>
            <a href="/terms" className="text-xs text-dash-muted hover:text-dash-primary">
              Terms
            </a>
            <a href="/cookies" className="text-xs text-dash-muted hover:text-dash-primary">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
