import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    title: "Beautiful Templates",
    description: "Choose from stunning, customizable themes that match your style.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    title: "Guest Management",
    description: "Easily manage your guest list, groups, and RSVPs all in one place.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.243m.015-.044a9.344 9.344 0 00-.015.044m.015-.044V18m0 0a4.125 4.125 0 01-4.121-4.121V13.5a4.125 4.125 0 014.121-4.121H18a4.125 4.125 0 014.121 4.121v.015" />
      </svg>
    ),
  },
  {
    title: "RSVP Tracking",
    description: "Real-time RSVP updates with plus ones, dietary needs, and messages.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Custom Pages",
    description: "Build custom pages with a block-based editor — no coding needed.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    title: "Share Anywhere",
    description: "QR codes and shareable links make it easy to invite everyone.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.769-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
  },
  {
    title: "Analytics",
    description: "Track views, RSVPs, and engagement with built-in analytics.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 13.125 4.5 3 12 3s9 10.125 9 10.125-4.5 6-9 6-9-6-9-6z" />
      </svg>
    ),
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-dash-text tracking-tight">
              Beautiful invitation websites
              <br />
              <span className="text-dash-primary">for your special day</span>
            </h1>
            <p className="mt-6 text-lg text-dash-muted max-w-2xl mx-auto">
              Create a stunning invitation website in minutes. Manage guests,
              track RSVPs, and share with loved ones — all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
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
      </section>

      {/* Features */}
      <section id="features" className="bg-dash-surface border-y border-dash-border">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dash-text">
              Everything you need
            </h2>
            <p className="mt-3 text-dash-muted max-w-xl mx-auto">
              Powerful tools to create and manage your invitation website with ease.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-dash-border bg-dash-bg p-6 transition-shadow hover:shadow-md"
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
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20 text-center">
        <h2 className="text-3xl font-bold text-dash-text">
          Ready to get started?
        </h2>
        <p className="mt-3 text-dash-muted max-w-xl mx-auto">
          Create your invitation website today. It's free and takes just minutes.
        </p>
        <div className="mt-6">
          <Link to="/auth">
            <Button size="lg">Create your website</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
