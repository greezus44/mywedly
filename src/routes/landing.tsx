import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: "🎨",
    title: "Beautiful Themes",
    description: "Choose from 10 stunning presets or customize every colour, font, and corner radius to match your style.",
  },
  {
    icon: "💌",
    title: "Smart Invitations",
    description: "Manage guests, groups, and RSVPs with ease. Send personalized links and track responses in real time.",
  },
  {
    icon: "📱",
    title: "Mobile-First",
    description: "Every website looks gorgeous on phones, tablets, and desktops. Share a QR code or a simple link.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "See who opened your invitation, track RSVPs, and monitor guest engagement with built-in analytics.",
  },
  {
    icon: "📄",
    title: "Custom Pages",
    description: "Build unlimited custom pages with a drag-and-drop block editor — no code required.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    description: "Password-protect your website or let guests log in by name. You control who sees what.",
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-6xl">
              Your special day,
              <br />
              <span className="text-dash-primary">beautifully online.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
              Create a stunning invitation website in minutes. Manage guests, track RSVPs, and share
              every detail of your celebration — all in one place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/templates">
                <Button variant="secondary" size="lg">
                  View Templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-dash-text">Everything you need</h2>
          <p className="mt-2 text-dash-muted">
            Powerful features to make your invitation website truly unforgettable.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-dash-text">{f.title}</h3>
              <p className="mt-2 text-sm text-dash-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl bg-dash-primary px-8 py-12 text-center text-dash-primary-fg">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-dash-primary-fg/90">
            Create your free invitation website today. No credit card required.
          </p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button variant="secondary" size="lg">
              Sign up now →
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
