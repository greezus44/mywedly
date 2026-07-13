import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Calendar, Palette, Share2, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Beautiful Templates",
    description: "Choose from curated, fully customizable themes designed for every type of event.",
  },
  {
    icon: Calendar,
    title: "Smart Guest Management",
    description: "Track RSVPs, send invitations, and manage your guest list all in one place.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Publish your event with a custom link and share it with guests in seconds.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Eventful</span>
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Create Beautiful Event Websites
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
          Design, customize, and share stunning event pages in minutes. No coding required — just pick a template and make it yours.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/login">
            <Button size="lg">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary" size="lg">View Demo</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 p-6 hover:border-slate-400 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-slate-500">
          Eventful — Create beautiful event websites.
        </div>
      </footer>
    </div>
  );
}
