import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    icon: "💌",
    title: "Beautiful Invitation Websites",
    description: "Create stunning, personalized invitation websites in minutes — no coding required.",
  },
  {
    icon: "🎨",
    title: "Customizable Themes",
    description: "Choose from 10 elegant presets or customize colors, fonts, and layouts to match your style.",
  },
  {
    icon: "📋",
    title: "Guest Management",
    description: "Organize guests into groups, track RSVPs, and manage invitations for multiple events.",
  },
  {
    icon: "📅",
    title: "Event Schedule",
    description: "Build a detailed timeline so your guests know exactly when and where to be.",
  },
  {
    icon: "📊",
    title: "Analytics & Insights",
    description: "Track visits, RSVP responses, and engagement with built-in analytics.",
  },
  {
    icon: "🔗",
    title: "Easy Sharing",
    description: "Share your website with a custom URL, QR code, or direct link to every guest.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl md:text-6xl">
            Your special day,
            <br />
            <span className="text-dash-primary">beautifully online.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
            MyWedly lets you create a stunning invitation website for your event — manage guests,
            track RSVPs, and share your story, all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get Started — It's Free</Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-dash-primary/10 blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-dash-text">Everything you need</h2>
        <p className="mt-2 text-center text-dash-muted">
          Powerful features to make your event planning effortless.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-dash-text">{f.title}</h3>
              <p className="mt-2 text-sm text-dash-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-dash-primary to-dash-primary-hover px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-white/90">Create your free invitation website today.</p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button variant="secondary" size="lg">
              Sign up now
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
