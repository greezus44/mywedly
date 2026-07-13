import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Eventify
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">
            Home
          </Link>
          <Link to="/templates" className="hover:text-gray-900">
            Templates
          </Link>
          <Link to="/pricing" className="hover:text-gray-900">
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
