import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { Calendar, Palette, Users, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Easy to Use",
    description: "Create and customize your event website in minutes with our intuitive editor. No coding required.",
  },
  {
    icon: Palette,
    title: "Beautiful Templates",
    description: "Choose from a curated collection of professionally designed templates tailored for any occasion.",
  },
  {
    icon: Users,
    title: "Manage Guests",
    description: "Track RSVPs, send invitations, and keep your guests informed all in one place.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-black/10">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Evently</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium text-black/70 hover:text-black transition-colors">
              Sign in
            </Link>
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-black text-white hover:bg-black/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-24 pb-32 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          Create Beautiful
          <br />
          Event Websites
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-black/60 max-w-2xl mx-auto leading-relaxed">
          Design stunning, personalized event pages in minutes. Share your story, manage guests, and make every
          celebration unforgettable.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className={cn(
              "inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg",
              "bg-black text-white text-base font-medium hover:bg-black/90 transition-colors"
            )}
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className={cn(
              "inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg",
              "bg-white text-black text-base font-medium border border-black/15 hover:bg-black/5 transition-colors"
            )}
          >
            View Demo
          </Link>
        </div>
      </section>

      <section className="border-t border-black/10 bg-black/[0.02]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl bg-white border border-black/10 hover:border-black/20 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-3 text-sm text-black/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Evently</span>
          </div>
          <p className="text-sm text-black/50">© {new Date().getFullYear()} Evently. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
