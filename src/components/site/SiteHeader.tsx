import React from "react";
import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="text-xl font-semibold text-gray-900"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            MyWedly
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            Home
          </Link>
          <Link
            to="/features"
            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className="rounded-md bg-gray-900 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-gray-700"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
