import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl lg:text-6xl">
                Beautiful invitation websites
                <span className="block text-dash-primary">for your special events</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
                Create a stunning, personalised invitation website in minutes.
                Share your love story, collect RSVPs, and keep guests informed —
                all in one place.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
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
        <section className="border-t border-dash-border bg-dash-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-dash-text">
                Everything you need
              </h2>
              <p className="mt-4 text-lg text-dash-muted">
                Powerful tools to make your event unforgettable.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon="🎨"
                title="Customisable Themes"
                description="Choose from dozens of beautiful themes and customise colours, fonts, and layouts to match your style."
              />
              <FeatureCard
                icon="💌"
                title="Smart RSVPs"
                description="Collect and track RSVPs with ease. Guests can respond online and you get real-time updates."
              />
              <FeatureCard
                icon="📱"
                title="Share Anywhere"
                description="Generate a shareable link or QR code. Your guests can access the website from any device."
              />
              <FeatureCard
                icon="📅"
                title="Event Schedule"
                description="Build a detailed timeline so guests know exactly when and where each part of the celebration happens."
              />
              <FeatureCard
                icon="👥"
                title="Guest Management"
                description="Organise guests into groups, manage invitations, and track who's coming at a glance."
              />
              <FeatureCard
                icon="📊"
                title="Analytics"
                description="See how many guests viewed your invitation, responded, and more with built-in analytics."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dash-primary">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-dash-primary-fg">
                Ready to create your invitation website?
              </h2>
              <p className="mt-4 text-lg text-dash-primary-fg/80">
                Join thousands of couples who chose MyWedly for their special day.
              </p>
              <div className="mt-8">
                <Link to="/auth">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white text-dash-primary hover:bg-white/90"
                  >
                    Start building — it's free
                  </Button>
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-dash-text">{title}</h3>
      <p className="mt-2 text-sm text-dash-muted">{description}</p>
    </div>
  );
}
