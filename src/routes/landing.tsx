import { Link } from "react-router-dom";
import { Calendar, Palette, Share2, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: Calendar,
    title: "Effortless Event Setup",
    description: "Create stunning event websites in minutes with our intuitive builder and pre-designed templates.",
  },
  {
    icon: Palette,
    title: "Beautiful Customization",
    description: "Tailor every detail with custom themes, colors, fonts, and layouts that match your event's aesthetic.",
  },
  {
    icon: Share2,
    title: "Seamless Guest Experience",
    description: "Share your event link, collect RSVPs, and keep guests informed with a polished, branded experience.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Eventful</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          Beautiful events, simplified
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto">
          Create Beautiful Event Websites
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-xl mx-auto">
          Design, customize, and share elegant event pages in minutes. No design skills required — just bring your vision.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/login">
            <Button size="lg" className="group">
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary" size="lg">View Demo</Button>
          </Link>
        </div>
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-sm">
          <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-900" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Your event preview appears here</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Everything you need</h2>
          <p className="mt-3 text-slate-600">Powerful features to make your event unforgettable.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-200 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ready to get started?</h2>
        <p className="mt-3 text-slate-600">Join thousands creating memorable events.</p>
        <div className="mt-8">
          <Link to="/login">
            <Button size="lg" className="group">
              Create your first event
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900">Eventful</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Eventful. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
