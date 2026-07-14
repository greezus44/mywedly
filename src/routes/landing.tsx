import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES: { title: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "Beautiful Templates",
    description:
      "Choose from dozens of professionally designed templates and customize them to match your style.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 3 3 0 005.78-1.128zm0 0a3 3 0 015.78 1.128 3 3 0 00-5.78-1.128zM17 16h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      </svg>
    ),
  },
  {
    title: "Guest Management",
    description:
      "Import guests, organize them into groups, and track RSVPs all in one place.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.353 9.327 9.327 0 00-1.213 2.933zM3.75 18a4.5 4.5 0 01.702-2.395 4.5 4.5 0 014.5-2.105 4.5 4.5 0 014.5 2.105A4.5 4.5 0 0113.5 18a4.5 4.5 0 01-4.5 4.5A4.5 4.5 0 013.75 18z" />
      </svg>
    ),
  },
  {
    title: "RSVP Tracking",
    description:
      "Collect and manage RSVP responses in real-time with automatic updates and notifications.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Custom Pages",
    description:
      "Build custom pages with a drag-and-drop editor. Add schedules, maps, FAQs, and more.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: "Share Anywhere",
    description:
      "Share your invitation website with a custom URL and QR code. Reach guests on any device.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
  },
  {
    title: "Analytics",
    description:
      "Track visits, views, and RSVP responses with built-in analytics to stay on top of everything.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 13.125 4.5 13.125 6 15c1.5 1.875 3 4.5 3 4.5s3-9 9-12" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-6xl">
              Create your dream{" "}
              <span className="text-dash-primary">wedding website</span> in minutes
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
              Share your special day with guests through a beautiful, personalized
              invitation website. Manage RSVPs, share your story, and keep everyone
              in the loop — all in one place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg">Get started free</Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg">
                  Learn more
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-dash-primary/5 to-transparent" />
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-dash-text">
            Everything you need
          </h2>
          <p className="mt-3 text-dash-muted">
            Powerful features to make your wedding planning effortless.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-dash-primary/10 text-dash-primary">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-dash-text">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-dash-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-dash-primary to-dash-primary-hover px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to share your special day?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Join thousands of couples who have created beautiful wedding
            invitation websites with MyWedly.
          </p>
          <div className="mt-8">
            <Link to="/auth">
              <Button
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
