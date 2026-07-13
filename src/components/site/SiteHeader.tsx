import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
const navLinks = [{ to: "/", label: "Home" }, { to: "/#features", label: "Features" }, { to: "/#pricing", label: "Pricing" }, { to: "/dashboard", label: "Dashboard" }];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-onyx/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl text-onyx tracking-tight">MyWedly</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-onyx/40 border-l border-onyx/20 pl-2">Editorial</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => <Link key={link.to} to={link.to} className={cn("text-sm uppercase tracking-wider transition-colors", location.pathname === link.to.split("#")[0] ? "text-onyx" : "text-onyx/50 hover:text-onyx")}>{link.label}</Link>)}
          <Link to="/auth" className="px-5 py-2 bg-onyx text-cream text-sm uppercase tracking-wider hover:bg-onyx-light transition-colors">Sign In</Link>
        </nav>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
      </div>
      {open && <div className="md:hidden border-t border-onyx/10 bg-cream">{navLinks.map((link) => <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="block px-6 py-3 text-sm uppercase tracking-wider text-onyx/70 hover:bg-onyx/5 border-b border-onyx/5">{link.label}</Link>)}</div>}
    </header>
  );
}
