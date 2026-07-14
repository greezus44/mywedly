import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: "🎨",
    title: "Beautiful Templates",
    description:
      "Choose from dozens of professionally designed templates and customize every detail to match your style.",
  },
  {
    icon: "✉️",
    title: "Digital Invitations",
    description:
      "Send personalized invitations to your guests with unique links. Track who has viewed and RSVP'd.",
  },
  {
    icon: "📅",
    title: "Event Schedule",
    description:
      "Share your full event schedule with venues, times, and dress codes so guests always know what's next.",
  },
  {
    icon: "💖",
    title: "RSVP Management",
    description:
      "Collect RSVPs online with dietary preferences, plus ones, and personal messages all in one place.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description:
      "See how many guests viewed your website, RSVP'd, and track engagement with built-in analytics.",
  },
  {
    icon: "🔒",
    title: "Privacy Controls",
    description:
      "Password protect your website or require guests to enter their name for a personalized experience.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
              Beautiful websites for your{" "}
              <span className="text-dash-primary">special day</span>
            </h1>
            <p className="mt-6 text-lg text-dash-muted md:text-xl">
              Create a stunning invitation website in minutes. Share your
              story, collect RSVPs, and keep guests informed — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-dash-primary/5 to-transparent" />
      </section>

      {/* Features */}
      <section className="border-t border-dash-border bg-dash-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-dash-text md:text-4xl">
              Everything you need
            </h2>
            <p className="mt-4 text-lg text-dash-muted">
              MyWedly gives you all the tools to create a memorable online
              experience for your guests.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-dash-border bg-dash-bg p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 text-3xl">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-dash-text">
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
      <section className="border-t border-dash-border">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <h2 className="text-3xl font-bold text-dash-text md:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-dash-muted">
            Create your free invitation website today. No credit card required.
          </p>
          <Link to="/auth" className="mt-8 inline-block">
            <Button size="lg">Create your website</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
