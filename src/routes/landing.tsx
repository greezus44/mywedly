import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";

const features = [
  {
    icon: "🎨",
    title: "Beautiful Templates",
    description: "Choose from dozens of professionally designed templates and customize every detail.",
  },
  {
    icon: "📱",
    title: "Mobile Optimized",
    description: "Your website looks stunning on every device — phones, tablets, and desktops.",
  },
  {
    icon: "✉️",
    title: "Guest Management",
    description: "Manage your guest list, track RSVPs, and send updates all in one place.",
  },
  {
    icon: "📍",
    title: "Event Details",
    description: "Share schedules, venue maps, dress codes, and everything guests need to know.",
  },
  {
    icon: "🔐",
    title: "Privacy Controls",
    description: "Password-protect your website or share a public link — you're in control.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "Track visits, RSVP responses, and engagement with built-in analytics.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
              Beautiful event websites
              <br />
              <span className="text-dash-primary">for your special day</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
              Create a stunning invitation website in minutes. Share your story,
              manage guests, and collect RSVPs — all in one place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                to="/auth"
                className="inline-flex items-center rounded-md bg-dash-primary px-6 py-3 text-base font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
              >
                Get started free
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center rounded-md border border-dash-border bg-dash-surface px-6 py-3 text-base font-medium text-dash-text transition-colors hover:bg-dash-bg"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-dash-text">
              Everything you need
            </h2>
            <p className="mt-2 text-dash-muted">
              Powerful features to make your event unforgettable.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-dash-bg text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-dash-text">
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
        <section className="bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <h2 className="text-3xl font-bold text-dash-text">
              Ready to get started?
            </h2>
            <p className="mt-2 text-dash-muted">
              Create your event website today — it's free to get started.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex items-center rounded-md bg-dash-primary px-6 py-3 text-base font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
            >
              Create your website
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
