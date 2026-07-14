import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-amber-700">MyWedly</span>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors">
            Pricing
          </a>
          <a href="#about" className="text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors">
            About
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 transition-colors shadow-sm"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
