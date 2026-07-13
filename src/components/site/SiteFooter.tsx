import React from "react";
import { Link } from "react-router-dom";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              MyWedly
            </span>
            <p className="text-sm text-gray-500">
              Beautiful event websites for every occasion.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Product
            </h4>
            <Link to="/features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link to="/templates" className="text-sm text-gray-600 hover:text-gray-900">
              Templates
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Company
            </h4>
            <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </Link>
            <Link to="/blog" className="text-sm text-gray-600 hover:text-gray-900">
              Blog
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Legal
            </h4>
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-center">
          <p className="text-xs text-gray-400">
            © {year} MyWedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
