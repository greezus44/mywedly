import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  const footerLinks = {
    Product: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Templates", href: "/#templates" },
    ],
    Company: [
      { label: "About", href: "/#about" },
      { label: "Contact", href: "/#contact" },
      { label: "Blog", href: "/#blog" },
    ],
    Support: [
      { label: "FAQ", href: "/#faq" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  };

  return (
    <footer className={cn("border-t border-dash-border bg-dash-surface", className)}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-dash-primary">MyWedly</span>
            </Link>
            <p className="mt-3 text-sm text-dash-muted">
              Beautiful invitation websites for your special day.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-dash-text">{heading}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
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

        <div className="mt-8 border-t border-dash-border pt-6">
          <p className="text-center text-xs text-dash-muted">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
