import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    title: "Beautiful Templates",
    description: "Choose from stunning, customizable themes tailored for any celebration.",
    icon: "🎨",
  },
  {
    title: "Guest Management",
    description: "Invite guests, track RSVPs, and organize groups with ease.",
    icon: "👥",
  },
  {
    title: "Custom Pages",
    description: "Build custom pages with a flexible block-based editor — no code required.",
    icon: "📄",
  },
  {
    title: "Share Anywhere",
    description: "Generate QR codes and shareable links to reach every guest.",
    icon: "🔗",
  },
  {
    title: "RSVP Tracking",
    description: "Get real-time RSVP updates and export guest lists to CSV.",
    icon: "✅",
  },
  {
    title: "Analytics",
    description: "Understand how guests interact with your invitation website.",
    icon: "📊",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl md:text-6xl">
          Beautiful invitation websites
          <br />
          <span className="text-dash-primary">for your special day</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
          MyWedly helps you create a stunning invitation website in minutes.
          Manage guests, track RSVPs, and share your celebration with the world.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/auth">
            <Button size="lg">Get started free</Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg">
              Learn more
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-dash-text">
          Everything you need
        </h2>
        <p className="mt-2 text-center text-dash-muted">
          All the tools to make your invitation website unforgettable.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-dash-text">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-dash-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg border border-dash-border bg-dash-surface p-12 text-center shadow-sm">
          <h2 className="text-3xl font-bold text-dash-text">
            Ready to get started?
          </h2>
          <p className="mt-2 text-dash-muted">
            Create your invitation website today — it's free to start.
          </p>
          <div className="mt-6">
            <Link to="/auth">
              <Button size="lg">Create your website</Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
