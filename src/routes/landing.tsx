import { Link } from "react-router-dom";
import {
  CalendarDays,
  Palette,
  Users,
  ClipboardCheck,
  QrCode,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Multi-Event Support",
    description:
      "Manage weddings, birthdays, corporate events, and conferences all from a single dashboard. Switch between events effortlessly.",
  },
  {
    icon: Palette,
    title: "Beautiful Themes",
    description:
      "Choose from a curated collection of elegant, fully customizable themes. Tailor colors, fonts, and layouts to match your occasion.",
  },
  {
    icon: Users,
    title: "Guest Management",
    description:
      "Organize your guest list with ease. Track groups, sides, and contact details in one beautifully simple interface.",
  },
  {
    icon: ClipboardCheck,
    title: "RSVP Tracking",
    description:
      "Collect and monitor RSVP responses in real time. Get instant insights into attendance, plus-ones, and dietary needs.",
  },
  {
    icon: QrCode,
    title: "QR Code Sharing",
    description:
      "Generate elegant QR codes for your event website. Share invitations across WhatsApp, email, and social media in a tap.",
  },
  {
    icon: Eye,
    title: "Live Preview",
    description:
      "See your changes instantly with a live, pixel-perfect preview. No publishing required to review your work.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-gray-900">
              Event Studio
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline-block"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1280&fit=crop"
            alt="Elegant event setup"
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium tracking-wide mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            The modern event website builder
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold text-white tracking-tight leading-[1.05]">
            Event Studio
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/85 font-light max-w-2xl mx-auto leading-relaxed">
            Create beautiful websites for your events. From intimate
            gatherings to grand celebrations — design, share, and manage every
            detail in one elegant place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition-all w-full sm:w-auto justify-center"
            >
              See Examples
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-white/70 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-20">
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
              Everything you need
            </span>
            <h2 className="mt-4 font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight">
              A complete toolkit for unforgettable events
            </h2>
            <p className="mt-5 text-lg text-gray-500 font-light leading-relaxed">
              Powerful features wrapped in a refined, intuitive interface. No
              technical skills required — just your vision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-white p-8 lg:p-10 transition-colors hover:bg-gray-50/70"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 mb-6 transition-colors group-hover:bg-gray-900 group-hover:text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="py-20 lg:py-28 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight">
            Ready to create something beautiful?
          </h2>
          <p className="mt-5 text-lg text-gray-400 font-light max-w-xl mx-auto leading-relaxed">
            Join hosts and organizers crafting memorable event experiences with
            Event Studio.
          </p>
          <div className="mt-10">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-all shadow-lg w-full sm:w-auto justify-center"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-900">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base tracking-tight text-white">
                Event Studio
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>
              <Link to="/login" className="hover:text-white transition-colors">
                Sign in
              </Link>
              <Link to="/login" className="hover:text-white transition-colors">
                Get Started
              </Link>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Event Studio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
