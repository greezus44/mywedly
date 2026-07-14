import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    icon: "💌",
    title: "Beautiful Invitation Websites",
    description:
      "Create stunning, personalized invitation websites for weddings, birthdays, baby showers, and any special occasion.",
  },
  {
    icon: "✅",
    title: "Smart RSVP Management",
    description:
      "Collect and track RSVPs effortlessly. Manage guest lists, dietary requirements, and plus ones all in one place.",
  },
  {
    icon: "🎨",
    title: "Customizable Themes",
    description:
      "Choose from 10 elegant presets or customize colors, fonts, and layouts to match your event's unique style.",
  },
  {
    icon: "📅",
    title: "Event Schedule",
    description:
      "Share your full event timeline so guests know exactly when and where each part of your celebration takes place.",
  },
  {
    icon: "👥",
    title: "Guest Groups",
    description:
      "Organize guests into groups and assign them to specific events. Send targeted invitations with a few clicks.",
  },
  {
    icon: "📊",
    title: "Analytics & Insights",
    description:
      "Track page views, RSVP responses, and guest engagement with built-in analytics dashboards.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dash-primary/10 via-dash-bg to-dash-accent/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
              Beautiful invitation websites
              <span className="block text-dash-primary">for every occasion</span>
            </h1>
            <p className="mt-6 text-lg text-dash-muted md:text-xl">
              MyWedly helps you create stunning invitation websites, manage RSVPs,
              and coordinate guests — all in one elegant platform.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/auth">
                <Button size="lg">Get started free</Button>
              </Link>
              <Link to="/auth">
                <Button variant="secondary" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-dash-text md:text-4xl">
            Everything you need to plan your event
          </h2>
          <p className="mt-4 text-lg text-dash-muted">
            From invitations to RSVPs to day-of coordination, MyWedly has you covered.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 text-3xl">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-dash-text">
                {feature.title}
              </h3>
              <p className="text-sm text-dash-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="rounded-2xl bg-gradient-to-br from-dash-primary to-dash-primary-hover px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to create your invitation website?
          </h2>
          <p className="mt-4 text-lg text-white/90">
            Join MyWedly today and start planning your perfect event.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-dash-primary hover:bg-white/90"
              >
                Create your website
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
