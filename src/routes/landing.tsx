import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: "💌",
    title: "Beautiful Invitation Websites",
    description: "Create a stunning invitation website for your wedding or special event in minutes.",
  },
  {
    icon: "👥",
    title: "Guest Management",
    description: "Manage your guest list, track RSVPs, and organize guests into groups with ease.",
  },
  {
    icon: "🎨",
    title: "Custom Themes",
    description: "Choose from 10 elegant presets or customise colors and fonts to match your style.",
  },
  {
    icon: "📅",
    title: "Event Schedule",
    description: "Build a timeline for your big day so guests always know what's happening and when.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "Track page views, RSVP responses, and guest engagement with built-in analytics.",
  },
  {
    icon: "🔗",
    title: "Easy Sharing",
    description: "Share your invitation with a custom URL, QR code, or direct link to guests.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl md:text-6xl">
              Beautiful Invitation Websites
              <br />
              <span className="text-dash-primary">for Every Celebration</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
              MyWedly helps you create a stunning, personalised invitation website for your wedding
              or special event. Manage guests, track RSVPs, and share your big day with ease.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/features">
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold text-dash-text">
              Everything you need
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-dash-muted">
              All the tools you need to create and manage your invitation website in one place.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm"
                >
                  <div className="text-3xl">{feature.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-dash-text">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="rounded-lg border border-dash-border bg-dash-surface p-12 text-center shadow-sm">
              <h2 className="text-3xl font-bold text-dash-text">
                Ready to create your invitation website?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-dash-muted">
                Get started for free and have your invitation website up and running in minutes.
              </p>
              <div className="mt-6">
                <Link to="/auth">
                  <Button size="lg">Create Your Website</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
