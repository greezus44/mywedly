import { Link } from "react-router-dom";
import { Calendar, Palette, Share2, Users, QrCode, Sparkles, Check } from "lucide-react";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  { icon: Calendar, title: "Event Management", description: "Create and manage events of any type — weddings, birthdays, corporate, and more." },
  { icon: Palette, title: "Custom Themes", description: "Fully customizable themes with colors, fonts, and presets to match your event's aesthetic." },
  { icon: Users, title: "Guest Management", description: "Organize guests into groups, track RSVPs, and send personalized invitations." },
  { icon: QrCode, title: "QR & Sharing", description: "Generate QR codes and shareable links to distribute your invitation effortlessly." },
  { icon: Share2, title: "Live Preview", description: "See your changes in real-time with a split editor and device previews." },
  { icon: Sparkles, title: "Rich Content", description: "Craft beautiful invitation pages with a rich text editor and custom content sections." },
];

const PRICING = [
  { name: "Free", price: "$0", period: "forever", features: ["1 event", "Up to 50 guests", "Basic themes", "QR code sharing"], cta: "Get started", highlight: false },
  { name: "Pro", price: "$19", period: "per month", features: ["Unlimited events", "Up to 500 guests", "All themes & presets", "Custom domains", "Analytics", "Priority support"], cta: "Start free trial", highlight: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["Everything in Pro", "Unlimited guests", "White-label branding", "Dedicated support", "Custom integrations"], cta: "Contact sales", highlight: false },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              <Sparkles className="h-3.5 w-3.5" />
              Beautiful invitations in minutes
            </span>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Create stunning event
              <br />
              invitations online
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Design, share, and manage your event — from weddings to corporate gatherings.
              Custom themes, guest lists, RSVPs, and more, all in one place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg">Get started free</Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="secondary">
                  View dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Everything you need
            </h2>
            <p className="mt-3 text-gray-600">
              Powerful tools to create and manage memorable events.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Simple, transparent pricing
              </h2>
              <p className="mt-3 text-gray-600">
                Choose the plan that works for you. No hidden fees.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {PRICING.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-lg border p-6 ${
                    plan.highlight
                      ? "border-gray-900 bg-white shadow-lg"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                  </div>
                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-600" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="mt-6">
                    <Button className="w-full" variant={plan.highlight ? "primary" : "secondary"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
