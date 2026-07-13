import { Link } from "react-router-dom";
import {
  CalendarHeart,
  Users,
  Palette,
  Share2,
  QrCode,
  Check,
  ArrowRight,
} from "lucide-react";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui";

const FEATURES = [
  {
    icon: Palette,
    title: "Beautiful Templates",
    description:
      "Choose from professionally designed themes and customize every detail to match your event.",
  },
  {
    icon: Users,
    title: "Guest Management",
    description:
      "Import guests, organize groups, track RSVPs, and send personalized invitations effortlessly.",
  },
  {
    icon: CalendarHeart,
    title: "Smart Scheduling",
    description:
      "Build a timeline for your event day with sub-events, venues, and dress codes all in one place.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description:
      "Generate QR codes and shareable links so guests can access your event site from anywhere.",
  },
  {
    icon: QrCode,
    title: "QR Code Invites",
    description:
      "Download QR codes as PNG or SVG to print on save-the-dates, invitations, or display at the venue.",
  },
  {
    icon: Check,
    title: "RSVP Tracking",
    description:
      "Collect RSVPs in real-time, track dietary requirements, and manage plus ones with ease.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for small gatherings and trying things out.",
    features: [
      "1 event website",
      "Up to 50 guests",
      "Basic templates",
      "RSVP tracking",
      "QR code sharing",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$19",
    period: "per month",
    description: "Everything you need for a memorable event.",
    features: [
      "Unlimited events",
      "Up to 500 guests per event",
      "All premium templates",
      "Custom themes & fonts",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For planners and large-scale celebrations.",
    features: [
      "Everything in Premium",
      "Unlimited guests",
      "Multiple sub-events",
      "Custom domain",
      "Team collaboration",
      "White-label option",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        navLinks={[
          { label: "Features", to: "/#features" },
          { label: "Templates", to: "/#templates" },
          { label: "Pricing", to: "/#pricing" },
          { label: "Sign in", to: "/auth" },
        ]}
      >
        <Link to="/auth">
          <Button size="sm">Sign up</Button>
        </Link>
      </SiteHeader>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="font-heading text-4xl font-bold text-gray-900 md:text-6xl">
              Beautiful event websites
              <br />
              <span className="text-gray-500">for every occasion</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Create a stunning, personalized website for your wedding, birthday,
              or corporate event. Manage guests, track RSVPs, and share your
              special day — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/auth">
                <Button size="lg">
                  Create your event <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/#features">
                <Button variant="secondary" size="lg">
                  Explore features
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-gray-100 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
                Everything you need
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Powerful tools to plan, manage, and share your event.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="p-6">
                  <div className="mb-4 inline-flex rounded-lg bg-gray-100 p-3">
                    <feature.icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="border-t border-gray-100 bg-gray-50 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
              Start with a template
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose from our curated collection and make it your own.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200" />
                <div className="p-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Classic</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    A clean, modern event template that works for any occasion.
                  </p>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-amber-50 to-amber-100" />
                <div className="p-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Rusty's Template
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Luxury wedding with cream &amp; gold aesthetic.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-gray-100 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
                Simple pricing
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Choose the plan that fits your event.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={
                    plan.highlight
                      ? "border-gray-900 p-6 ring-2 ring-gray-900"
                      : "p-6"
                  }
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="mt-8 block">
                    <Button
                      variant={plan.highlight ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
