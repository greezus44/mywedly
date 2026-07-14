import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    title: "Beautiful Cover Pages",
    description: "Stunning cover designs with custom typography, images, and logos.",
    icon: "🎨",
  },
  {
    title: "Guest Management",
    description: "Track RSVPs, manage guest groups, and send invitations with ease.",
    icon: "👥",
  },
  {
    title: "Custom Pages",
    description: "Build custom pages with a drag-and-drop block editor.",
    icon: "📄",
  },
  {
    title: "Theme Customization",
    description: "Choose from presets or customize colors, fonts, and buttons.",
    icon: "🎭",
  },
  {
    title: "RSVP Tracking",
    description: "Real-time RSVP updates with dietary preferences and plus-ones.",
    icon: "✅",
  },
  {
    title: "Analytics",
    description: "Track visits, shares, and engagement on your invitation site.",
    icon: "📊",
  },
];

const TESTIMONIALS = [
  {
    quote: "MyWedly made our wedding invitations effortless. Our guests loved the beautiful design!",
    author: "Sarah & James",
  },
  {
    quote: "The RSVP tracking saved us hours. Everything was organized in one place.",
    author: "Priya & Arjun",
  },
  {
    quote: "So easy to customize. Our invitation matched our wedding theme perfectly.",
    author: "Emily & Michael",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl md:text-6xl">
            Beautiful Invitation Websites
            <br />
            <span className="text-dash-primary">for Your Special Day</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
            Create a stunning invitation website for your wedding. Manage guests,
            track RSVPs, and share your love story — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link to="/features">
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-dash-border bg-dash-surface py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-dash-text">
            Everything You Need
          </h2>
          <p className="mt-2 text-center text-dash-muted">
            All the tools to create and manage your invitation website.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-dash-border bg-dash-bg p-6 transition-shadow hover:shadow-md"
              >
                <div className="text-3xl">{feature.icon}</div>
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

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-dash-text">
            Loved by Couples
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.author}
                className="rounded-lg border border-dash-border bg-dash-surface p-6"
              >
                <p className="text-sm italic text-dash-text">
                  "{testimonial.quote}"
                </p>
                <p className="mt-4 text-sm font-semibold text-dash-primary">
                  — {testimonial.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-dash-border bg-dash-primary py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Create Your Invitation?
          </h2>
          <p className="mt-2 text-white/90">
            Start building your beautiful invitation website today.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-dash-primary hover:bg-white/90"
            >
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default LandingPage;
