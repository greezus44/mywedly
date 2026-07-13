import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Heart, Users, QrCode, Palette, Sparkles, Check } from "lucide-react";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui";

const features = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Beautiful Event Sites",
    description: "Create stunning, personalized event websites in minutes with our easy-to-use editor.",
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: "Custom Themes",
    description: "Choose from curated themes or customize colors, fonts, and layouts to match your style.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Guest Management",
    description: "Track RSVPs, organize guests into groups, and manage your guest list with ease.",
  },
  {
    icon: <QrCode className="h-6 w-6" />,
    title: "QR Code Sharing",
    description: "Generate QR codes and shareable links to send to your guests instantly.",
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Event Timeline",
    description: "Build a detailed schedule so your guests know exactly when and where to be.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Live Preview",
    description: "See your changes in real-time with our split editor and device previews.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["1 event website", "Basic themes", "Up to 50 guests", "QR code sharing"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$19",
    period: "per month",
    features: ["Unlimited events", "All premium themes", "Unlimited guests", "Custom domain", "Analytics", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    features: ["Everything in Premium", "Multiple collaborators", "Advanced analytics", "White-label option", "API access"],
    cta: "Contact Us",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p
            className="mb-4 text-sm uppercase tracking-[0.3em] text-gray-500"
            style={{ fontFamily: '"Dancing Script", cursive' }}
          >
            Your special day deserves a special site
          </p>
          <h1
            className="mb-6 text-5xl font-semibold text-gray-900 md:text-6xl"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            Beautiful event websites
            <br />
            for every occasion
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Create a stunning, personalized website for your wedding, birthday, or
            corporate event. Manage guests, track RSVPs, and share your special day
            with ease.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2
              className="mb-3 text-3xl font-semibold text-gray-900"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Everything you need
            </h2>
            <p className="text-gray-500">
              Powerful features to make your event planning effortless
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2
              className="mb-3 text-3xl font-semibold text-gray-900"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500">
              Choose the plan that's right for you
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {pricingTiers.map((tier, idx) => (
              <div
                key={idx}
                className={`flex flex-col rounded-lg border bg-white p-6 ${
                  tier.highlighted
                    ? "border-gray-900 shadow-lg ring-2 ring-gray-900"
                    : "border-gray-200"
                }`}
              >
                <h3 className="mb-1 text-lg font-semibold text-gray-900">
                  {tier.name}
                </h3>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  <span className="text-sm text-gray-500">/ {tier.period}</span>
                </div>
                <ul className="mb-6 flex flex-1 flex-col gap-2">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button
                    variant={tier.highlighted ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2
            className="mb-4 text-3xl font-semibold text-white"
            style={{ fontFamily: '"Cormorant Garamond", serif' }}
          >
            Ready to create your event site?
          </h2>
          <p className="mb-8 text-gray-300">
            Join thousands of hosts who've made their events unforgettable.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
