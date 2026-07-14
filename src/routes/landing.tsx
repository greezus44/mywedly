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
      "Create stunning, personalized invitation websites for your special day with our easy-to-use builder.",
  },
  {
    icon: " Guests",
    title: "Guest Management",
    description:
      "Manage your guest list, track RSVPs, and organize guests into groups — all in one place.",
  },
  {
    icon: "🎨",
    title: "Custom Themes",
    description:
      "Choose from 10 gorgeous presets or customize colors and fonts to match your style perfectly.",
  },
  {
    icon: "📅",
    title: "Event Schedule",
    description:
      "Build a detailed schedule for all your events so guests always know where to be and when.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description:
      "Track page views, RSVP responses, and guest engagement with built-in analytics.",
  },
  {
    icon: "🔗",
    title: "Easy Sharing",
    description:
      "Share your website with a custom URL, QR codes, and direct links to individual guests.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-dash-text tracking-tight">
            Build your dream{" "}
            <span className="text-dash-primary">invitation website</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-dash-muted max-w-2xl mx-auto">
            MyWedly lets you create a beautiful, personalized website for your special day —
            manage guests, track RSVPs, and share every detail effortlessly.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link to="/auth">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-dash-primary/20 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-dash-primary/10 blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl w-full px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-dash-text">
            Everything you need for your big day
          </h2>
          <p className="mt-3 text-dash-muted">
            Powerful tools to manage every aspect of your invitation website.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-dash-text">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl w-full px-4 py-16">
        <div className="rounded-2xl border border-dash-border bg-dash-surface p-10 text-center shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-dash-text">
            Ready to create your invitation website?
          </h2>
          <p className="mt-3 text-dash-muted">
            Join MyWedly today and start building your perfect website in minutes.
          </p>
          <Link to="/auth" className="inline-block mt-6">
            <Button size="lg">Get Started Now</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
