import React from "react";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 py-8">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} MyWedly. All rights reserved.</p>
      </div>
    </footer>
  );
}
