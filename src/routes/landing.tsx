import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    title: "Beautiful Invitation Websites",
    description:
      "Create a stunning, personalized invitation website for your event in minutes — no design skills needed.",
    icon: "💌",
  },
  {
    title: "Guest Management",
    description:
      "Add guests, organize them into groups, and track RSVPs all in one place. Export data anytime.",
    icon: "👥",
  },
  {
    title: "Smart RSVP Tracking",
    description:
      "Collect RSVPs per event, track plus ones, dietary requirements, and guest messages effortlessly.",
    icon: "✅",
  },
  {
    title: "Custom Pages",
    description:
      "Build custom pages with a block-based editor — add schedules, photo galleries, venue details, and more.",
    icon: "📄",
  },
  {
    title: "Share with QR Codes",
    description:
      "Generate QR codes and shareable links so guests can access your invitation website instantly.",
    icon: "🔗",
  },
  {
    title: "Analytics & Insights",
    description:
      "See who opened your invitation, track RSVP progress, and stay on top of your guest list.",
    icon: "📊",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl md:text-6xl">
            Create your perfect <span className="text-dash-primary">invitation website</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
            MyWedly helps you build a beautiful, personalized invitation website for your event.
            Manage guests, track RSVPs, and share with ease.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-dash-text">
            Everything you need
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-dash-muted">
            All the tools you need to create and manage your invitation website, in one place.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
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
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
          <div className="rounded-xl border border-dash-border bg-dash-surface p-12 text-center shadow-sm">
            <h2 className="text-3xl font-bold text-dash-text">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-dash-muted">
              Create your invitation website today. It's free to get started.
            </p>
            <Link to="/auth" className="mt-6 inline-block">
              <Button size="lg">Create your website</Button>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
