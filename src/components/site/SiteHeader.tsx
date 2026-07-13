import React from "react";
import { Link } from "react-router-dom";
import { CalendarHeart } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <CalendarHeart className="w-6 h-6 text-teal-700" />
          <span className="text-lg font-semibold text-slate-900">MyWedly</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</Link>
          <Link to="/auth" className="text-sm px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800">Sign In</Link>
        </nav>
      </div>
    </header>
  );
}
