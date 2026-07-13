import { Link } from "react-router-dom";
export function SiteFooter() {
  return (
    <footer className="bg-onyx text-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <span className="font-heading text-3xl">MyWedly</span>
            <p className="mt-4 text-sm text-cream/60 max-w-sm leading-relaxed">The editorial wedding planning platform for modern couples. Design, share, and celebrate — beautifully.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-cream/40 mb-4">Product</p>
            <ul className="space-y-2.5 text-sm text-cream/70">
              <li><Link to="/#features" className="hover:text-cream">Features</Link></li>
              <li><Link to="/#pricing" className="hover:text-cream">Pricing</Link></li>
              <li><Link to="/dashboard" className="hover:text-cream">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-cream/40 mb-4">Company</p>
            <ul className="space-y-2.5 text-sm text-cream/70">
              <li><Link to="/auth" className="hover:text-cream">Sign In</Link></li>
              <li><a href="#" className="hover:text-cream">Privacy</a></li>
              <li><a href="#" className="hover:text-cream">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/40">© {new Date().getFullYear()} MyWedly. All rights reserved.</p>
          <p className="text-xs text-cream/40 font-script italic">Crafted for modern celebrations</p>
        </div>
      </div>
    </footer>
  );
}
