import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1m-6 0V4a2 2 0 112 0v1m-4 0h8a2 2 0 012 2v3a6 6 0 01-6 6 6 6 0 01-6-6V6a2 2 0 012-2z" />
      </svg>
    ),
    title: "Beautiful Templates",
    description: "Choose from professionally designed templates and customize every detail to match your style.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "Guest Management",
    description: "Organize guests into groups, track RSVPs, and manage invitations for every event.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "RSVP Tracking",
    description: "Collect and monitor RSVP responses in real-time with detailed analytics and insights.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Custom Pages",
    description: "Build custom pages with a drag-and-drop block editor — no coding required.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Schedule & Timeline",
    description: "Plan out every moment with a detailed schedule for all your events.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    ),
    title: "Easy Sharing",
    description: "Share your website with a custom URL and QR code. Track visits and engagement.",
  },
];

export default function Landing(): React.ReactElement {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dash-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-dash-border bg-dash-surface px-4 py-1.5 text-sm text-dash-muted">
            <span className="flex h-2 w-2 rounded-full bg-dash-primary" />
            Create your invitation website in minutes
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
            Beautiful invitation websites
            <br />
            <span className="text-dash-primary">for your special day</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
            MyWedly helps you create stunning invitation websites for weddings and events.
            Manage guests, track RSVPs, and share your story — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link to="/auth">
              <Button variant="secondary" size="lg">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-dash-text md:text-4xl">Everything you need</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dash-muted">
            Powerful features to help you create and manage the perfect invitation website.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dash-primary/10 text-dash-primary">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-dash-text">{feature.title}</h3>
              <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="rounded-2xl border border-dash-border bg-dash-surface p-12 text-center shadow-sm">
          <h2 className="text-3xl font-bold text-dash-text md:text-4xl">Ready to get started?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-dash-muted">
            Create your free account and build your invitation website today.
          </p>
          <div className="mt-8">
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
