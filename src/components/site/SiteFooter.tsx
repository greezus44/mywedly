import React from "react";
import { Link } from "react-router-dom";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-dash-text">
              <span className="text-dash-primary">My</span>Wedly
            </div>
            <p className="mt-2 text-sm text-dash-muted">
              Beautiful invitation websites for every celebration.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-dash-text">Product</h4>
            <ul className="space-y-2 text-sm text-dash-muted">
              <li><Link to="/features" className="hover:text-dash-text">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-dash-text">Pricing</Link></li>
              <li><Link to="/templates" className="hover:text-dash-text">Templates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-dash-text">Company</h4>
            <ul className="space-y-2 text-sm text-dash-muted">
              <li><Link to="/about" className="hover:text-dash-text">About</Link></li>
              <li><Link to="/contact" className="hover:text-dash-text">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-dash-text">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-dash-text">Legal</h4>
            <ul className="space-y-2 text-sm text-dash-muted">
              <li><Link to="/privacy" className="hover:text-dash-text">Privacy</Link></li>
              <li><Link to="/terms" className="hover:text-dash-text">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-dash-border pt-6 text-center text-sm text-dash-muted">
          © {new Date().getFullYear()} MyWedly. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
