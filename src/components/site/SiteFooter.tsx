import React from "react";
import { cn } from "../../lib/utils";

export function SiteFooter() {
  return (
    <footer className="border-t border-dash-border bg-dash-surface">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-bold text-dash-primary">MyWedly</span>
            <p className="mt-2 text-sm text-dash-muted max-w-xs">
              Create beautiful event websites for your special day.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Product</h3>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Pricing</a></li>
              <li><a href="#templates" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Templates</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Company</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-sm text-dash-muted hover:text-dash-text transition-colors">About</a></li>
              <li><a href="#contact" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Contact</a></li>
              <li><a href="#blog" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dash-text mb-3">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#privacy" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Privacy</a></li>
              <li><a href="#terms" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-dash-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dash-muted">© {new Date().getFullYear()} MyWedly. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Twitter</a>
            <a href="#" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Instagram</a>
            <a href="#" className="text-sm text-dash-muted hover:text-dash-text transition-colors">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
