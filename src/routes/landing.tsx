import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    title: "Beautiful Templates",
    description: "Start from elegant, professionally designed wedding themes and make them yours.",
    icon: "💐",
  },
  {
    title: "Guest Management",
    description: "Invite guests, track RSVPs, manage groups, and collect dietary preferences in one place.",
    icon: "💌",
  },
  {
    title: "Custom Pages",
    description: "Build custom pages with a flexible block editor — your story, your schedule, your way.",
    icon: "🛠️",
  },
  {
    title: "Share Anywhere",
    description: "Publish to a shareable link with a QR code and social sharing built right in.",
    icon: "🔗",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="text-xl font-semibold text-gray-800">MyWedly</div>
        <Link to="/auth">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </header>

      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Build a wedding website as unique as your love story
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          MyWedly helps you create a stunning, personalised wedding site in minutes —
          manage guests, share your schedule, and collect RSVPs all in one place.
        </p>
        <Link to="/auth">
          <Button size="lg">Create your event</Button>
        </Link>
      </section>

      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 border border-gray-200 rounded-xl bg-gray-50">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 text-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to get started?</h2>
        <p className="text-gray-500 mb-6">Create your free wedding website today.</p>
        <Link to="/auth">
          <Button size="lg">Get started</Button>
        </Link>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-gray-400 border-t border-gray-200">
        © {new Date().getFullYear()} MyWedly
      </footer>
    </div>
  );
}
