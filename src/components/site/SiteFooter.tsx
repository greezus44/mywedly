import { Link } from "react-router-dom";
export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2"><span className="font-heading text-3xl">MyWedly</span><p className="mt-4 text-sm text-gray-400 max-w-sm leading-relaxed">The wedding planning platform for modern couples. Design, share, and celebrate — beautifully.</p></div>
          <div><p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Product</p><ul className="space-y-2.5 text-sm text-gray-400"><li><Link to="/#features" className="hover:text-white">Features</Link></li><li><Link to="/#pricing" className="hover:text-white">Pricing</Link></li><li><Link to="/dashboard" className="hover:text-white">Dashboard</Link></li></ul></div>
          <div><p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Company</p><ul className="space-y-2.5 text-sm text-gray-400"><li><Link to="/auth" className="hover:text-white">Sign In</Link></li><li><a href="#" className="hover:text-white">Privacy</a></li><li><a href="#" className="hover:text-white">Terms</a></li></ul></div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4"><p className="text-xs text-gray-500">© {new Date().getFullYear()} MyWedly. All rights reserved.</p></div>
      </div>
    </footer>
  );
}
