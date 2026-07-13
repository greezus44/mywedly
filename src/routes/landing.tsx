import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-white text-black antialiased">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-[15px] tracking-tight">
            <span className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold">E</span>
            Event Studio
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/login" className="px-3 py-1.5 text-sm text-gray-600 hover:text-black transition-colors">Sign in</Link>
            <Link to="/login" className="px-4 py-1.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className={`max-w-[1100px] mx-auto text-center transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-500 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
            Multi-event website builder
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Beautiful websites<br />
            for every event.
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Create, manage, and share stunning event pages. From weddings to conferences,
            one platform for all your events.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/login" className="px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors">
              Get Started
            </Link>
            <a href="#features" className="px-6 py-3 text-sm font-medium text-black bg-white border border-gray-300 rounded-lg hover:border-black transition-colors">
              Learn more
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to launch.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {[
              { title: "Multi-Event Support", desc: "Manage weddings, birthdays, conferences, and more from a single dashboard. Each event is independent." },
              { title: "Beautiful Themes", desc: "Choose from curated presets or customize every color, font, and detail to match your vision." },
              { title: "Guest Management", desc: "Track guests, RSVPs, dietary preferences, and plus ones. Export data anytime." },
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 hover:bg-gray-50/50 transition-colors">
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Three steps to launch.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create an event", desc: "Pick a template, set your event details, and customize the theme." },
              { step: "02", title: "Add your guests", desc: "Import your guest list, manage RSVPs, and track responses in real-time." },
              { step: "03", title: "Share and celebrate", desc: "Generate QR codes, share links, and let guests interact with your event page." },
            ].map((s, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-mono text-gray-400">{s.step}</p>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: "11", label: "Event types" },
              { stat: "10+", label: "Theme presets" },
              { stat: "100%", label: "Customizable" },
              { stat: "0", label: "Coding required" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-4xl font-bold tracking-tight">{s.stat}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ready to create?</h2>
          <p className="text-gray-500 mb-8">Start building your event website in minutes.</p>
          <Link to="/login" className="inline-flex px-6 py-3 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors">
            Get Started for Free
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <span className="w-5 h-5 rounded bg-black text-white flex items-center justify-center text-[10px] font-bold">E</span>
            Event Studio
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Event Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
