import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Users, Palette, Check } from "lucide-react";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <SiteHeader />
      <section className="max-w-6xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="animate-fade-in-up">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-6">Wedding Planning, Reimagined</p>
          <h1 className="font-heading text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-3xl mx-auto">Design your wedding.<br />Invite your world.</h1>
          <p className="mt-8 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">A clean, modern platform for creating beautiful wedding websites, managing guests, and tracking RSVPs — all in one place.</p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all animate-fade-in" style={{ borderRadius: "var(--radius)" }}>Start Building <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/#features" className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-200 text-sm font-medium hover:border-gray-400 transition-all" style={{ borderRadius: "var(--radius)" }}>Explore Features</Link>
          </div>
        </div>
      </section>
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-100">
        <div className="text-center mb-16"><p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">Features</p><h2 className="font-heading text-3xl md:text-4xl tracking-tight">Everything you need, nothing you don't.</h2></div>
        <div className="grid md:grid-cols-3 gap-px bg-gray-100 border border-gray-100">
          {[{ icon: Users, title: "Guest Management", desc: "Organize guests into groups, send bulk invitations, and track RSVPs per event. Manual overrides always take precedence." }, { icon: Calendar, title: "Multiple Events", desc: "Create unlimited events within one invitation — ceremony, reception, rehearsal dinner — each with its own RSVP and schedule." }, { icon: Palette, title: "Theme Customization", desc: "Full control over colors, fonts, and layout with live preview. Changes apply instantly across all pages, no refresh needed." }].map((f) => (
            <div key={f.title} className="bg-white p-10 hover:bg-gray-50 transition-colors"><div className="w-10 h-10 mb-6 flex items-center justify-center border border-gray-200" style={{ borderRadius: "var(--radius)" }}><f.icon className="w-5 h-5 text-gray-600" /></div><h3 className="font-heading text-xl mb-3">{f.title}</h3><p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p></div>
          ))}
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-100">
        <div className="text-center mb-16"><p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">How it Works</p><h2 className="font-heading text-3xl md:text-4xl tracking-tight">Three steps to your wedding website.</h2></div>
        <div className="grid md:grid-cols-3 gap-16">
          {[{ step: "01", title: "Create your event", desc: "Set up your invitation with a custom URL, choose a template, and configure your theme." }, { step: "02", title: "Add your guests", desc: "Import guests via CSV, organize them into groups, and invite groups to specific events." }, { step: "03", title: "Share and track", desc: "Generate QR codes, share your link, and watch RSVPs come in with real-time analytics." }].map((s) => (
            <div key={s.step} className="text-center md:text-left"><span className="font-heading text-5xl text-gray-200 block mb-4">{s.step}</span><h3 className="font-heading text-xl mb-2">{s.title}</h3><p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p></div>
          ))}
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-gray-400">
          {["No code required", "Custom domain ready", "Real-time RSVPs", "Mobile optimized", "GDPR compliant"].map((t) => <div key={t} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-gray-300" />{t}</div>)}
        </div>
      </section>
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-100">
        <div className="text-center mb-16"><p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">Pricing</p><h2 className="font-heading text-3xl md:text-4xl tracking-tight">Simple, transparent pricing.</h2></div>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[{ name: "Free", price: "$0", desc: "For small celebrations", features: ["1 event", "Up to 50 guests", "Basic themes", "Custom URL"], highlight: false }, { name: "Pro", price: "$29", desc: "For most weddings", features: ["Unlimited events", "Unlimited guests", "All themes", "QR codes & sharing", "Analytics"], highlight: true }, { name: "Studio", price: "$99", desc: "For planners & venues", features: ["Everything in Pro", "Multiple invitations", "Team access", "Priority support", "White-label option"], highlight: false }].map((p) => (
            <div key={p.name} className={`p-8 border ${p.highlight ? "border-black bg-black text-white" : "border-gray-200 bg-white"}`} style={{ borderRadius: "var(--radius)" }}>
              <h3 className="font-heading text-2xl mb-1">{p.name}</h3><p className={`text-sm mb-6 ${p.highlight ? "text-gray-400" : "text-gray-500"}`}>{p.desc}</p><p className="font-heading text-4xl mb-6">{p.price}<span className="text-sm text-gray-400">/mo</span></p>
              <ul className="space-y-3 mb-8">{p.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm"><Check className={`w-4 h-4 ${p.highlight ? "text-gray-400" : "text-gray-300"}`} />{f}</li>)}</ul>
              <Link to="/auth" className={`block text-center px-6 py-2.5 text-sm font-medium transition-all ${p.highlight ? "bg-white text-black hover:bg-gray-100" : "border border-gray-200 hover:border-gray-400"}`} style={{ borderRadius: "var(--radius)" }}>Get Started</Link>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-black text-white"><div className="max-w-6xl mx-auto px-6 py-24 text-center"><h2 className="font-heading text-3xl md:text-5xl tracking-tight mb-6">Begin your story.</h2><p className="text-gray-400 max-w-lg mx-auto mb-10">Create your wedding website in minutes. No design skills required.</p><Link to="/auth" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-all" style={{ borderRadius: "var(--radius)" }}>Create Your Event <ArrowRight className="w-4 h-4" /></Link></div></section>
      <SiteFooter />
    </div>
  );
}
