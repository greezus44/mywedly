import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/#features", label: "Features" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl text-black tracking-tight">MyWedly</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm transition-colors",
                location.pathname === link.to.split("#")[0] ? "text-black" : "text-gray-500 hover:text-black"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/auth"
            className="px-5 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
            style={{ borderRadius: "var(--radius)" }}
          >
            Sign In
          </Link>
        </nav>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/auth"
            onClick={() => setOpen(false)}
            className="block px-6 py-3 text-sm text-black font-medium border-b border-gray-100"
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  );
}
