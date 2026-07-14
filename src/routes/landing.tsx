import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: "💌",
    title: "Beautiful Invitations",
    description: "Create stunning invitation websites for your special day with customizable themes and layouts.",
  },
  {
    icon: "guests",
    title: "Guest Management",
    description: "Manage your guest list, track RSVPs, and organize guests into groups with ease.",
  },
  {
    icon: "📅",
    title: "Event Schedule",
    description: "Share your event timeline so guests know exactly when and where to be.",
  },
  {
    icon: "🔗",
    title: "Easy Sharing",
    description: "Share your event with a simple link or QR code. No app downloads required.",
  },
];

const steps = [
  { number: "01", title: "Create Your Event", description: "Start by creating a new event and choosing a template that fits your style." },
  { number: "02", title: "Customize Everything", description: "Edit the cover, home page, theme, schedule, and more with our intuitive editor." },
  { number: "03", title: "Share with Guests", description: "Publish your event and share the link or QR code with your guests." },
  { number: "04", title: "Track RSVPs", description: "Watch responses come in and manage your guest list in real time." },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl lg:text-6xl">
              Beautiful invitation websites for your special day
            </h1>
            <p className="mt-6 text-lg text-dash-muted sm:text-xl">
              MyWedly helps you create stunning event websites, manage guests, track RSVPs, and share
              your celebration with the people who matter most.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/auth?mode=signup">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="secondary">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-dash-text sm:text-4xl">Everything you need</h2>
            <p className="mt-4 text-lg text-dash-muted">
              Powerful features to make your event planning effortless.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-dash-border bg-dash-bg p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-dash-primary/10 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-dash-text">{feature.title}</h3>
                <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-dash-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-dash-text sm:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-dash-muted">Get your event website live in minutes.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-dash-primary/10 text-2xl font-bold text-dash-primary">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-dash-text">{step.title}</h3>
                <p className="mt-2 text-sm text-dash-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-dash-border bg-dash-primary/5">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-dash-text sm:text-4xl">
            Ready to create your event?
          </h2>
          <p className="mt-4 text-lg text-dash-muted">
            Join MyWedly today and build a beautiful invitation website for your special day.
          </p>
          <div className="mt-8">
            <Link to="/auth?mode=signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
