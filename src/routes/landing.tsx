import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    icon: "💌",
    title: "Beautiful Invitations",
    description:
      "Create stunning, personalized invitation websites that reflect your unique style and story.",
  },
  {
    icon: "📅",
    title: "Smart RSVPs",
    description:
      "Collect and track RSVPs effortlessly. Manage guest lists, dietary needs, and plus ones.",
  },
  {
    icon: "🎨",
    title: "Custom Themes",
    description:
      "Choose from gorgeous presets or fine-tune every color and font to match your vision.",
  },
  {
    icon: "📊",
    title: "Guest Analytics",
    description:
      "Track visits, responses, and engagement with built-in analytics dashboards.",
  },
  {
    icon: "🔗",
    title: "Easy Sharing",
    description:
      "Share your site with a custom URL or QR code. Reach every guest in seconds.",
  },
  {
    icon: "✨",
    title: "Custom Pages",
    description:
      "Build additional pages with a flexible block editor — stories, schedules, maps, and more.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dash-bg">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-dash-surface border border-dash-border text-xs font-medium text-dash-muted mb-6">
              ✨ Create your dream invitation website
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-dash-text tracking-tight">
              Your special day,
              <br />
              <span className="text-dash-primary">beautifully shared.</span>
            </h1>
            <p className="mt-6 text-lg text-dash-muted max-w-2xl mx-auto">
              MyWedly helps you create a stunning invitation website, manage your
              guest list, track RSVPs, and share every detail — all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-dash-surface border-y border-dash-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-dash-text">
                Everything you need
              </h2>
              <p className="mt-3 text-dash-muted">
                Powerful tools to manage your invitation website with ease.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border border-dash-border bg-dash-bg p-6 transition-shadow hover:shadow-md"
                >
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="text-lg font-semibold text-dash-text mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-dash-muted">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20 text-center">
          <h2 className="text-3xl font-bold text-dash-text">
            Ready to get started?
          </h2>
          <p className="mt-3 text-dash-muted">
            Create your free invitation website in minutes.
          </p>
          <div className="mt-6">
            <Link to="/auth">
              <Button size="lg">Create Your Website</Button>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
