import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: "💌",
    title: "Beautiful Invitation Websites",
    description: "Create stunning, personalized invitation websites for your special day in minutes.",
  },
  {
    icon: "🎨",
    title: "Customizable Themes",
    description: "Choose from 10+ elegant themes or customize colors, fonts, and layouts to match your style.",
  },
  {
    icon: "📋",
    title: "Guest Management",
    description: "Manage your guest list, track RSVPs, and organize guests into groups effortlessly.",
  },
  {
    icon: "📅",
    title: "Event Schedule",
    description: "Share your event timeline so guests know exactly when and where to be.",
  },
  {
    icon: "📊",
    title: "Analytics & Insights",
    description: "Track visits, RSVP responses, and engagement with built-in analytics.",
  },
  {
    icon: "🔗",
    title: "Easy Sharing",
    description: "Share your website with a custom URL and QR code. Guests can RSVP online.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-dash-text tracking-tight">
            Create beautiful invitation
            <br />
            <span className="text-dash-primary">websites for your events</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-dash-muted">
            MyWedly helps you build stunning, personalized invitation websites with guest
            management, RSVPs, and more — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dash-text">
              Everything you need for your event
            </h2>
            <p className="mt-4 text-lg text-dash-muted">
              Powerful features to make your invitation website truly special.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-dash-border bg-dash-bg p-6 transition-shadow hover:shadow-md"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-dash-text">{feature.title}</h3>
                <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dash-bg">
        <div className="mx-auto max-w-4xl px-4 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-dash-text">
            Ready to create your invitation website?
          </h2>
          <p className="mt-4 text-lg text-dash-muted">
            Join MyWedly today and start building your perfect event website.
          </p>
          <Link to="/auth" className="inline-block mt-8">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
