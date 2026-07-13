import { useNavigate } from "react-router-dom";
import { Sparkles, Users, CalendarCheck, Eye, ArrowRight, Heart } from "lucide-react";
import { Button } from "../components/ui/Button";

const features = [
  {
    icon: Sparkles,
    title: "Beautiful Designs",
    description: "Choose from a curated collection of elegant, customizable templates crafted for every wedding style.",
  },
  {
    icon: Users,
    title: "Guest Management",
    description: "Organize your guest list with ease. Add, group, and manage attendees all in one place.",
  },
  {
    icon: CalendarCheck,
    title: "RSVP Tracking",
    description: "Track responses in real time and keep a clear view of who's coming to your special day.",
  },
  {
    icon: Eye,
    title: "Live Preview",
    description: "See your changes instantly with a live preview before sharing your invitation with the world.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          <span className="text-lg font-semibold tracking-tight">Lumière</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
          Sign in
        </Button>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 md:pt-28 md:pb-32 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6">
            The Wedding Invitation Platform
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-light leading-tight tracking-tight mb-8">
            Create Your Dream
            <br />
            <span className="italic">Wedding Invitation</span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Design elegant, personalized digital invitations that capture the essence of your celebration.
            Manage guests, track RSVPs, and share your story — all in one refined platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate("/login")}>
              Wedding Creator Login
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate("/login")}>
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 md:px-12 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-light tracking-tight mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              A thoughtfully crafted toolkit to bring your wedding invitation to life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white p-8 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors duration-200"
                >
                  <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-gray-900 text-white mb-6">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-medium mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 md:px-12 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-light tracking-tight mb-6">
            Begin your invitation journey
          </h2>
          <p className="text-gray-600 mb-10">
            Join the creators who trust Lumière to share their most cherished moments.
          </p>
          <Button size="lg" onClick={() => navigate("/login")}>
            Wedding Creator Login
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">Lumière</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Lumière. Crafted with care for your special day.
          </p>
        </div>
      </footer>
    </div>
  );
}
