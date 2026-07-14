import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-dash-muted sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} MyWedly. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link to="/" className="hover:text-dash-text">Home</Link>
          <Link to="/auth" className="hover:text-dash-text">Sign In</Link>
        </nav>
      </div>
    </footer>
  );
}
