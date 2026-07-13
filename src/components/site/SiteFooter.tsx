import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Eventify. All rights reserved.
          </div>
          <nav className="flex items-center gap-4 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-900">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gray-900">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-gray-900">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
