import { Link } from "react-router-dom";
import {
  Users,
  CalendarClock,
  Link as LinkIcon,
  Image as ImageIcon,
  QrCode,
  Share2,
  Clock,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";

const HERO_IMAGE =
  "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800";

const GUEST_FEATURES = [
  {
    icon: Users,
    title: "Guest Groups",
    description:
      "Organize guests into sides, families, or tiers. Manage invitations with editorial precision.",
  },
  {
    icon: CalendarClock,
    title: "RSVP Closing Dates",
    description:
      "Set firm deadlines with automatic reminders. Know your final count in elegant time.",
  },
  {
    icon: LinkIcon,
    title: "Custom URLs",
    description:
      "Every event gets its own memorable address. Share beautifully, track every visit.",
  },
];

const BUILDER_FEATURES = [
  "Cover designer with image, overlay, and typography controls",
  "Theme colors — onyx, cream, gold, or your own palette",
  "Custom content sections — story, schedule, travel, and more",
];

const FEATURE_GRID = [
  { icon: ImageIcon, title: "Image Uploads", description: "Curated galleries for every moment." },
  { icon: QrCode, title: "QR Codes", description: "Generated automatically for instant sharing." },
  { icon: Share2, title: "Sharing", description: "One link, every platform, effortless elegance." },
  { icon: Clock, title: "Timeline", description: "A chronological narrative of your celebration." },
  { icon: MessageSquare, title: "Messages", description: "Guest well-wishes, gathered in one place." },
  { icon: BarChart3, title: "Analytics", description: "Views, RSVPs, and engagement — at a glance." },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For intimate gatherings and first chapters.",
    features: ["1 event", "Guest list up to 50", "Core themes", "Custom URL"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For couples who want the full editorial experience.",
    features: [
      "Unlimited events",
      "Unlimited guests",
      "All themes & custom colors",
      "QR codes & analytics",
      "Priority support",
    ],
    cta: "Choose Pro",
    highlighted: true,
  },
  {
    name: "Studio",
    price: "$99",
    period: "per month",
    description: "For planners and studios managing many celebrations.",
    features: [
      "Everything in Pro",
      "Multi-user collaboration",
      "White-label branding",
      "Advanced analytics",
      "Dedicated manager",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />

      {/* 1. Hero — split layout */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20 lg:py-28">
          <div className="animate-fade-in-up">
            <span className="text-xs uppercase tracking-widest text-onyx/40 border-b border-onyx/20 pb-2">
              Volume I
            </span>
            <h1 className="mt-8 font-heading text-5xl lg:text-7xl text-onyx leading-[1.05] tracking-tight">
              The Modern Curator
            </h1>
            <p className="mt-6 text-lg text-onyx/60 leading-relaxed max-w-md">
              An editorial platform for wedding planning. Design, share, and
              celebrate — with the elegance of a printed magazine and the ease
              of modern software.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg">Create Your Event</Button>
              </Link>
              <Link to="/#features">
                <Button size="lg" variant="secondary">
                  See Features
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative animate-fade-in">
            <div className="aspect-[4/5] overflow-hidden border border-onyx/10">
              <img
                src={HERO_IMAGE}
                alt="Editorial wedding — elegant table setting"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-onyx text-cream px-5 py-3 hidden sm:block">
              <span className="text-xs uppercase tracking-widest">
                Editorial No. 01
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Guest Management preview — onyx bg */}
      <section className="bg-onyx text-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-cream/40 border-b border-cream/20 pb-2">
              Volume II — Guests
            </span>
            <h2 className="mt-8 font-heading text-4xl lg:text-5xl leading-tight">
              Guest Management, Refined
            </h2>
            <p className="mt-4 text-cream/60 leading-relaxed">
              Every guest, accounted for. Every reply, in its place.
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-px bg-cream/10">
            {GUEST_FEATURES.map((feature) => (
              <div key={feature.title} className="bg-onyx p-8 lg:p-10">
                <feature.icon className="w-8 h-8 text-cream/70" strokeWidth={1.25} />
                <h3 className="mt-6 font-heading text-2xl">{feature.title}</h3>
                <p className="mt-3 text-sm text-cream/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Editorial Builder — cream bg, split */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-onyx/40 border-b border-onyx/20 pb-2">
              Volume III — The Builder
            </span>
            <h2 className="mt-8 font-heading text-4xl lg:text-5xl text-onyx leading-tight">
              Compose Your Story
            </h2>
            <p className="mt-6 text-lg text-onyx/60 leading-relaxed max-w-md">
              A page builder designed like a magazine spread. Drag, type, and
              arrange — every section a paragraph in your celebration.
            </p>
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-wider text-onyx border-b border-onyx/30 pb-1 hover:border-onyx transition-colors">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="border border-onyx/10 bg-white">
            <ul className="divide-y divide-onyx/10">
              {BUILDER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-4 p-6">
                  <span className="flex-shrink-0 mt-0.5 w-6 h-6 bg-onyx text-cream flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm text-onyx/70 leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Feature Grid — white bg */}
      <section id="features" className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-onyx/40">
              The Collection
            </span>
            <h2 className="mt-4 font-heading text-4xl lg:text-5xl text-onyx leading-tight">
              Everything, Considered
            </h2>
            <p className="mt-4 text-onyx/50 leading-relaxed">
              Six essentials, thoughtfully crafted. No clutter, no excess.
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-px bg-onyx/10 border border-onyx/10">
            {FEATURE_GRID.map((feature) => (
              <div key={feature.title} className="bg-white p-8 lg:p-10 group">
                <feature.icon
                  className="w-8 h-8 text-onyx/70 group-hover:text-onyx transition-colors"
                  strokeWidth={1.25}
                />
                <h3 className="mt-6 font-heading text-2xl text-onyx">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-onyx/50 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing — cream bg */}
      <section id="pricing" className="bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-onyx/40">
              The Editions
            </span>
            <h2 className="mt-4 font-heading text-4xl lg:text-5xl text-onyx leading-tight">
              Pricing
            </h2>
            <p className="mt-4 text-onyx/50 leading-relaxed">
              Choose the volume that suits your celebration.
            </p>
          </div>
          <div className="mt-16 grid md:grid-cols-3 gap-8 items-start">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={
                  tier.highlighted
                    ? "bg-onyx text-cream border border-onyx p-8 lg:p-10 md:-translate-y-4"
                    : "bg-white text-onyx border border-onyx/10 p-8 lg:p-10"
                }
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-2xl">{tier.name}</h3>
                  {tier.highlighted && (
                    <span className="text-[10px] uppercase tracking-widest bg-cream text-onyx px-2.5 py-1">
                      Popular
                    </span>
                  )}
                </div>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-heading text-4xl">{tier.price}</span>
                  <span
                    className={tier.highlighted ? "text-sm text-cream/50" : "text-sm text-onyx/40"}
                  >
                    {tier.period}
                  </span>
                </div>
                <p
                  className={
                    tier.highlighted
                      ? "mt-3 text-sm text-cream/60 leading-relaxed"
                      : "mt-3 text-sm text-onyx/50 leading-relaxed"
                  }
                >
                  {tier.description}
                </p>
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check
                        className={
                          tier.highlighted
                            ? "w-4 h-4 mt-0.5 text-cream/70 flex-shrink-0"
                            : "w-4 h-4 mt-0.5 text-onyx/60 flex-shrink-0"
                        }
                      />
                      <span className={tier.highlighted ? "text-cream/80" : "text-onyx/70"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="mt-10 block">
                  <Button
                    variant={tier.highlighted ? "secondary" : "primary"}
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

      {/* 6. CTA — onyx bg */}
      <section className="bg-onyx text-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-24 lg:py-32 text-center">
          <span className="text-xs uppercase tracking-widest text-cream/40">
            The First Page
          </span>
          <h2 className="mt-6 font-heading text-4xl lg:text-6xl leading-tight">
            Begin Your Story
          </h2>
          <p className="mt-6 text-cream/60 leading-relaxed max-w-xl mx-auto">
            Every great celebration begins with a single page. Yours is waiting.
          </p>
          <Link to="/auth" className="mt-10 inline-block">
            <Button size="lg" variant="secondary">
              Create Your Event
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
