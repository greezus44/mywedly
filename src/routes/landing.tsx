import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: "🎨",
    title: "Beautiful Templates",
    description: "Choose from stunning, customizable themes designed for weddings and special events.",
  },
  {
    icon: "💌",
    title: "Digital Invitations",
    description: "Send elegant online invitations and track RSVPs in real time, all in one place.",
  },
  {
    icon: "📊",
    title: "Guest Management",
    description: "Organize guests into groups, manage plus ones, and export data with ease.",
  },
  {
    icon: "📱",
    title: "Share Anywhere",
    description: "Generate QR codes and shareable links so guests can access your site instantly.",
  },
  {
    icon: "✍️",
    title: "Custom Pages",
    description: "Build custom pages with a block-based editor — no coding required.",
  },
  {
    icon: "📈",
    title: "Analytics",
    description: "Track visits, RSVP responses, and engagement with built-in analytics.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
                Beautiful invitation websites
                <span className="block text-dash-primary">for your special day</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
                MyWedly helps you create stunning invitation websites, manage guests,
                and track RSVPs — all in one elegant platform.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/auth">
                  <Button size="lg">Get started free</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="secondary" size="lg">
                    View demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-amber-50 via-transparent to-transparent" />
        </section>

        {/* Features */}
        <section id="features" className="border-t border-dash-border bg-dash-surface">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-dash-text">Everything you need</h2>
              <p className="mt-3 text-dash-muted">
                Powerful tools to create and manage your invitation website effortlessly.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border border-dash-border bg-dash-surface p-6 transition-shadow hover:shadow-md"
                >
                  <div className="text-3xl">{f.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-dash-text">{f.title}</h3>
                  <p className="mt-2 text-sm text-dash-muted">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-dash-border">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <h2 className="text-3xl font-bold text-dash-text">Ready to get started?</h2>
            <p className="mt-3 text-dash-muted">
              Create your invitation website in minutes. No credit card required.
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
