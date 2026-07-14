import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    title: "Beautiful Templates",
    description:
      "Choose from dozens of professionally designed templates tailored to your style.",
    icon: "🎨",
  },
  {
    title: "Guest Management",
    description:
      "Track RSVPs, manage guest lists, and organize groups — all in one place.",
    icon: "👥",
  },
  {
    title: "Custom Pages",
    description:
      "Build unlimited custom pages with our drag-and-drop block editor.",
    icon: "📄",
  },
  {
    title: "Smart Sharing",
    description:
      "Share your website with a custom URL and QR codes for every guest.",
    icon: "🔗",
  },
  {
    title: "Analytics",
    description:
      "See who visited your site, track RSVPs, and monitor engagement in real time.",
    icon: "📊",
  },
  {
    title: "Event Schedule",
    description:
      "Create a detailed timeline so your guests always know what's happening.",
    icon: "📅",
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Your perfect event
              <br />
              <span className="text-primary">starts here</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              MyWedly helps you create a stunning invitation website in minutes.
              Manage guests, track RSVPs, and share your special day with ease.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg">Get started — it's free</Button>
              </Link>
              <Link to="/features">
                <Button variant="secondary" size="lg">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-surface-alt py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold text-foreground">
              Everything you need
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted">
              Powerful features to make your event planning effortless.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to create your website?
            </h2>
            <p className="mt-3 text-muted">
              Join thousands of couples who chose MyWedly for their special day.
            </p>
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg">Create your website</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
