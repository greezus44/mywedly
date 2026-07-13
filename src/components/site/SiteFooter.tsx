import { Link } from "react-router-dom";

export interface SiteFooterProps {
  links?: { label: string; to: string }[];
}

const DEFAULT_LINKS = [
  { label: "About", to: "/about" },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Contact", to: "/contact" },
];

export function SiteFooter({ links }: SiteFooterProps) {
  const footerLinks = links ?? DEFAULT_LINKS;
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <Link to="/" className="font-heading text-xl font-bold text-gray-900">
              MyWedly
            </Link>
            <p className="text-xs text-gray-500">
              Beautiful event websites for every occasion.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-4">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
