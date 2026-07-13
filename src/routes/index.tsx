import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const heroPavilion =
  "https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=1600";
const couplePortrait =
  "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyWedly — Editorial wedding planning & websites" },
      {
        name: "description",
        content:
          "The modern curator's platform for weddings. Build an editorial wedding website, manage guests and RSVPs, and host every event with quiet precision.",
      },
      { property: "og:title", content: "MyWedly — Editorial wedding planning & websites" },
      {
        property: "og:description",
        content:
          "The modern curator's platform for weddings. Build an editorial wedding website, manage guests and RSVPs, and host every event with quiet precision.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-parchment text-onyx font-sans">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20">
        {/* Hero split view */}
        <section className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 space-y-12">
            <div>
              <p className="eyebrow mb-6">Wedding planning · est. 2026</p>
              <h1 className="font-serif text-6xl md:text-7xl leading-[0.9] mb-6">
                The Modern <br />
                <em className="italic font-medium">Curator.</em>
              </h1>
              <p className="text-onyx/60 max-w-sm leading-relaxed text-base">
                Planning is no longer a chore, it is an editorial exercise. Manage guests, gallery,
                and the guest experience with the precision of a gallery director.
              </p>
              <div className="mt-8 flex gap-4">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex items-center bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors"
                >
                  Begin planning
                </Link>
                <Link
                  to="/w/$slug"
                  params={{ slug: "elias-and-sora" }}
                  className="inline-flex items-center border border-onyx px-6 py-3 text-xs uppercase tracking-widest hover:bg-onyx hover:text-parchment transition-colors"
                >
                  View a site
                </Link>
              </div>
            </div>

            <div className="bg-card border border-onyx/10 p-8 shadow-soft">
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-xs uppercase tracking-widest font-bold">Guest Management</h2>
                <span className="text-3xl serif-italic">142 / 200</span>
              </div>
              <div className="space-y-1">
                <GuestRow name="Isabella & Julian Rossi" tag="Confirmed" tone="success" />
                <GuestRow name="The Davenport Family" tag="Pending RSVP" tone="warning" />
                <GuestRow name="Marcus Thorne" tag="Waitlist" tone="neutral" />
              </div>
              <button className="w-full mt-8 py-4 border border-onyx text-xs uppercase tracking-widest hover:bg-onyx hover:text-parchment transition-all">
                Generate QR Check-in
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative group">
              <div className="absolute -top-6 -left-6 z-10 bg-sepia text-parchment px-4 py-2 text-[10px] uppercase tracking-tight">
                Live Site Preview
              </div>
              <div className="border-8 border-card shadow-editorial overflow-hidden aspect-[4/5] bg-mist">
                <div className="h-full flex flex-col items-center pt-16 md:pt-20 px-8 md:px-12 text-center">
                  <img
                    src={couplePortrait}
                    alt="Wedding couple portrait"
                    className="w-full aspect-[4/5] object-cover mb-10 grayscale"
                  />
                  <h3 className="font-serif text-5xl mb-4 italic">Elias & Sora</h3>
                  <p className="uppercase tracking-[0.3em] text-[10px] mb-10">
                    October 24, 2026 — Kyoto, Japan
                  </p>
                  <div className="w-full border-t border-onyx/20 pt-10 text-left">
                    <h4 className="font-serif text-2xl mb-6">The Schedule</h4>
                    <div className="grid grid-cols-2 gap-8 text-xs leading-relaxed">
                      <ScheduleBlock
                        time="17:00"
                        label="The Ceremony"
                        body="Honen-in Temple Garden. Traditional exchange under the maples."
                      />
                      <ScheduleBlock
                        time="19:30"
                        label="The Banquet"
                        body="Park Hyatt Ballroom. Minimalist feast and seasonal pairing."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Builder Section */}
        <section id="builder" className="mt-32">
          <div className="flex items-baseline justify-between border-b border-onyx mb-12 pb-4 flex-wrap gap-2">
            <h2 className="font-serif text-4xl">Editorial Builder</h2>
            <p className="text-xs uppercase tracking-widest">Modules for the modern host</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 md:gap-8">
            <ModuleCard
              n="01"
              dark
              title="Digital Concierge"
              body="Automated travel suggestions and local maps integrated for every guest."
            />
            <ModuleCard
              n="02"
              title="Film Gallery"
              body="A high-fidelity space for cinematic video and scanned 35mm photography."
            />
            <ModuleCard
              n="03"
              title="Guestbook Alpha"
              body="Voice-note integration for guests to leave intimate messages before arrival."
            />
            <ModuleCard
              n="04"
              title="Registry Noir"
              body="A curated marketplace of design-led objects, not just basic household goods."
            />
          </div>
        </section>

        {/* Editorial cover / craft */}
        <section id="craft" className="mt-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <img
              src={heroPavilion}
              alt="Architectural wedding pavilion at dusk"
              className="w-full aspect-[4/3] object-cover grayscale border border-onyx/10"
            />
          </div>
          <div className="lg:col-span-5 order-1 lg:order-2">
            <p className="eyebrow mb-6">Volume I · The philosophy</p>
            <h3 className="font-serif text-4xl md:text-5xl leading-[1.05] mb-6">
              An <em className="italic">editorial</em> record of the day.
            </h3>
            <p className="text-onyx/70 leading-relaxed mb-4">
              Aethel is a wedding platform for couples who value restraint. No florid animations, no
              pastel gradients. Just a working room for guests, a stage for photography, and a site
              that reads like a small monograph.
            </p>
            <p className="text-onyx/70 leading-relaxed">
              Built for weddings held in gardens, warehouses, temples, and villas. Designed by
              people who plan them themselves.
            </p>
          </div>
        </section>

        {/* Feature grid */}
        <section id="showcase" className="mt-32">
          <div className="flex items-baseline justify-between border-b border-onyx mb-12 pb-4 flex-wrap gap-2">
            <h2 className="font-serif text-4xl">The Complete Suite</h2>
            <p className="text-xs uppercase tracking-widest">Twenty-one modules · one platform</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
            {FEATURES.map((f) => (
              <div key={f} className="border-t border-onyx/15 pt-4">
                <p className="text-sm font-medium">{f}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-32">
          <div className="flex items-baseline justify-between border-b border-onyx mb-12 pb-4 flex-wrap gap-2">
            <h2 className="font-serif text-4xl">The Editions</h2>
            <p className="text-xs uppercase tracking-widest">Three tiers, one atelier</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              tier="Essential"
              price="Free"
              body="One wedding site, up to 40 guests, RSVP, gallery, and guestbook."
              cta="Begin planning"
            />
            <PricingCard
              tier="Premium"
              price="$18/mo"
              featured
              body="Unlimited guests, custom domain, multi-event, budget & checklist, QR check-in."
              cta="Start free trial"
            />
            <PricingCard
              tier="Atelier"
              price="Custom"
              body="For planners managing many weddings. Team collaboration and white-label."
              cta="Contact us"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

const FEATURES = [
  "Website builder",
  "Guest management",
  "RSVP management",
  "Multiple events",
  "Photo gallery",
  "Guestbook",
  "Digital invitations",
  "Wedding timeline",
  "Budget planner",
  "Checklist & tasks",
  "Vendor directory",
  "Registry management",
  "Travel & lodging",
  "Wedding party",
  "Seating chart",
  "QR check-in",
  "Announcements",
  "Messaging",
  "Analytics",
  "Planner dashboard",
  "AI drafting",
];

function GuestRow({
  name,
  tag,
  tone,
}: {
  name: string;
  tag: string;
  tone: "success" | "warning" | "neutral";
}) {
  const cls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/15 text-onyx"
        : "bg-onyx/5 text-onyx/50";
  return (
    <div className="flex justify-between items-center py-3 border-b border-onyx/5 last:border-0">
      <span className="text-sm">{name}</span>
      <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-widest ${cls}`}>
        {tag}
      </span>
    </div>
  );
}

function ScheduleBlock({ time, label, body }: { time: string; label: string; body: string }) {
  return (
    <div>
      <p className="font-bold mb-1 italic serif-italic text-lg">{time}</p>
      <p className="uppercase tracking-widest text-[9px] opacity-60 mb-2">{label}</p>
      <p>{body}</p>
    </div>
  );
}

function ModuleCard({
  n,
  title,
  body,
  dark,
}: {
  n: string;
  title: string;
  body: string;
  dark?: boolean;
}) {
  return (
    <div
      className={
        (dark ? "bg-onyx text-parchment" : "bg-card border border-onyx/10 text-onyx") +
        " p-6 aspect-square flex flex-col justify-between"
      }
    >
      <span className={"text-4xl serif-italic " + (dark ? "" : "text-sepia")}>{n}</span>
      <div>
        <h5 className="text-sm font-semibold mb-2">{title}</h5>
        <p
          className={"text-[11px] leading-relaxed " + (dark ? "text-parchment/60" : "text-onyx/60")}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

function PricingCard({
  tier,
  price,
  body,
  cta,
  featured,
}: {
  tier: string;
  price: string;
  body: string;
  cta: string;
  featured?: boolean;
}) {
  return (
    <div
      className={
        (featured ? "bg-onyx text-parchment" : "bg-card border border-onyx/10 text-onyx") +
        " p-8 flex flex-col"
      }
    >
      <p className={"eyebrow mb-6 " + (featured ? "text-parchment/70" : "")}>{tier}</p>
      <p className="font-serif text-5xl mb-4">{price}</p>
      <p
        className={
          "text-sm leading-relaxed mb-8 " + (featured ? "text-parchment/70" : "text-onyx/60")
        }
      >
        {body}
      </p>
      <Link
        to="/auth"
        search={{ mode: "signup" }}
        className={
          "mt-auto text-center py-3 text-xs uppercase tracking-widest transition-colors " +
          (featured
            ? "bg-parchment text-onyx hover:bg-mist"
            : "border border-onyx hover:bg-onyx hover:text-parchment")
        }
      >
        {cta}
      </Link>
    </div>
  );
}
