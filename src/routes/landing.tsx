import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.5c0-.9-.4-1.7-1-2.3V8a3 3 0 00-3-3h-1V3h-2v2h-4V3H8v2H7a3 3 0 00-3 3v5.2c-.6.6-1 1.4-1 2.3v4a1 1 0 001 1h1v2h2v-2h10v2h2v-2h1a1 1 0 001-1v-4z" />
      </svg>
    ),
    title: "Beautiful Invitation Websites",
    description: "Create stunning, personalized invitation websites for your special day in minutes.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Guest Management",
    description: "Easily manage your guest list, track RSVPs, and organize guests into groups.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "RSVP Tracking",
    description: "Real-time RSVP responses with dietary requirements, plus ones, and guest messages.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: "Custom Themes",
    description: "Choose from 10 beautiful presets or customize colors and fonts to match your style.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Schedule & Events",
    description: "Create detailed schedules for all your events — ceremony, reception, and more.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l4-4 4 4m0 0v12m0-12l4 4 4-4M7 4v16" />
      </svg>
    ),
    title: "Easy Sharing",
    description: "Share your website with a custom URL and QR code. Track visits with built-in analytics.",
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
              Beautiful invitation websites
              <span className="block text-dash-primary">for your special day</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
              Create a stunning invitation website for your wedding or event. Manage guests,
              track RSVPs, and share your celebration — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/auth">
                <Button size="lg">Start building — it's free</Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" size="lg">
                  See features
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-dash-primary/10 blur-3xl" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-dash-text">Everything you need</h2>
          <p className="mt-2 text-dash-muted">Powerful tools to create and manage your invitation website</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-dash-border bg-dash-surface p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-dash-primary/10 text-dash-primary">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-dash-text">{feature.title}</h3>
              <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-xl border border-dash-border bg-dash-surface p-10 text-center md:p-16">
          <h2 className="text-3xl font-bold text-dash-text">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-dash-muted">
            Create your free invitation website today. No coding required.
          </p>
          <div className="mt-6">
            <Link to="/auth">
              <Button size="lg">Create your website</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="flex-1" />

      <SiteFooter />
    </div>
  );
};
