import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: "💌",
    title: "Beautiful Invitation Websites",
    description: "Create a stunning website for your event in minutes with our easy-to-use editor.",
  },
  {
    icon: " guests",
    title: "Guest Management",
    description: "Organize guests into groups, track RSVPs, and manage invitations all in one place.",
  },
  {
    icon: "🎨",
    title: "Custom Themes",
    description: "Choose from gorgeous presets or customize colors and fonts to match your style.",
  },
  {
    icon: "📱",
    title: "Share Anywhere",
    description: "Generate QR codes and shareable links to send to your guests instantly.",
  },
  {
    icon: "📊",
    title: "Analytics",
    description: "Track views, RSVPs, and guest engagement with built-in analytics.",
  },
  {
    icon: "📝",
    title: "Custom Pages",
    description: "Build custom pages with a drag-and-drop block editor for your schedule, venue, FAQ, and more.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-dash-bg to-dash-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl md:text-6xl">
              Beautiful invitation websites
              <span className="block text-dash-primary">for your special day</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
              MyWedly helps you create stunning event websites, manage guests, track RSVPs,
              and share your celebration — all in one place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/auth">
                <Button variant="secondary" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-dash-text">Everything you need</h2>
            <p className="mt-2 text-dash-muted">
              Powerful features to make your event planning effortless.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-dash-text">{f.title}</h3>
                <p className="mt-2 text-sm text-dash-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dash-surface py-16">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-3xl font-bold text-dash-text">Ready to get started?</h2>
            <p className="mt-2 text-dash-muted">
              Create your free account and build your first event website today.
            </p>
            <Link to="/auth" className="mt-6 inline-block">
              <Button size="lg">Create Your Website</Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
