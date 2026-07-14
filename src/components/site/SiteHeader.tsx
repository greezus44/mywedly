import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "cover", label: "Cover" },
  { to: "login", label: "Login" },
  { to: "home", label: "Home" },
  { to: "events", label: "Events" },
  { to: "guests", label: "Guests" },
  { to: "groups", label: "Groups" },
  { to: "rsvp", label: "RSVP" },
  { to: "timeline", label: "Timeline" },
  { to: "pages", label: "Pages" },
  { to: "theme", label: "Theme" },
  { to: "wishes", label: "Wishes" },
  { to: "sharing", label: "Sharing" },
  { to: "analytics", label: "Analytics" },
  { to: "settings", label: "Settings" },
];

export function SiteHeader({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-semibold text-gray-800">MyWedly</Link>
        <button onClick={() => setOpen(!open)} className="lg:hidden p-2" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--event-primary, #8B7355)" }}>
            {open ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
          </svg>
        </button>
        <nav className="hidden lg:flex gap-1">
          {NAV_ITEMS.map((item) => {
            const path = `/event/${eventId}/${item.to}`;
            const active = location.pathname === path || location.pathname.startsWith(path + "/");
            return (
              <Link key={item.to} to={path} className={`px-3 py-1.5 rounded text-sm ${active ? "bg-[var(--event-primary,#8B7355)] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-gray-200 px-4 py-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const path = `/event/${eventId}/${item.to}`;
            const active = location.pathname === path || location.pathname.startsWith(path + "/");
            return (
              <Link key={item.to} to={path} onClick={() => setOpen(false)} className={`px-3 py-2 rounded text-sm ${active ? "bg-[var(--event-primary,#8B7355)] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
