import React from "react";
import { Link } from "react-router-dom";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-dash-border bg-dash-surface/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2"><span className="text-xl font-bold text-dash-text">MyWedly</span></Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-dash-muted hover:text-dash-text transition-colors">Features</Link>
          <Link to="/auth" className="text-sm font-medium text-dash-primary hover:text-dash-primary-hover transition-colors">Sign in</Link>
        </nav>
      </div>
    </header>
  );
}
