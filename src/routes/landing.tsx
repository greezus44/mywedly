import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    title: "Beautiful Templates",
    description: "Choose from stunning, professionally designed templates that you can customise to match your style.",
    icon: "🎨",
  },
  {
    title: "Guest Management",
    description: "Easily manage your guest list, track RSVPs, and organise guests into groups for every Event.",
    icon: "👥",
  },
  {
    title: "Custom Pages",
    description: "Build custom pages with a drag-and-drop block editor — no coding required.",
    icon: "📄",
  },
  {
    title: "RSVP & Forms",
    description: "Collect RSVPs with custom questions, dietary requirements, and plus-one details.",
    icon: "✉️",
  },
  {
    title: "Sharing & QR Codes",
    description: "Share your invitation website with a link or QR code. Track views and engagement.",
    icon: "🔗",
  },
  {
    title: "Analytics",
    description: "See who visited, who responded, and get insights into your invitation performance.",
    icon: "📊",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-dash-text tracking-tight">
            Create beautiful event websites
          </h1>
          <p className="mt-6 text-lg md:text-xl text-dash-muted max-w-2xl mx-auto">
            MyWedly helps you build a stunning invitation website for your special day —
            manage guests, collect RSVPs, and share with ease.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get started — it's free</Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">Learn more</Button>
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-dash-text text-center mb-12">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-dash-text mb-2">{f.title}</h3>
                <p className="text-sm text-dash-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="rounded-lg border border-dash-border bg-dash-surface p-12">
            <h2 className="text-3xl font-bold text-dash-text mb-4">
              Ready to build your event website?
            </h2>
            <p className="text-lg text-dash-muted mb-8">
              Join MyWedly today and create a memorable online experience for your guests.
            </p>
            <Link to="/auth">
              <Button size="lg">Start building</Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
