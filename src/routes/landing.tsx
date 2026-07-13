import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    title: "Beautiful Templates",
    description: "Choose from professionally designed templates for any event type.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Guest Management",
    description: "Organize guests into groups, manage RSVPs, and track responses in real time.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-2.246-2.9M3 20h5v-2a3 3 0 015.246-2.9M9 4a3 3 0 100 6 3 3 0 000-6zm8 2a3 3 0 100 6 3 3 0 000-6z" />
      </svg>
    ),
  },
  {
    title: "Custom Pages",
    description: "Build custom pages with a drag-and-drop block editor. No coding required.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    title: "RSVP Tracking",
    description: "Collect RSVPs online and track responses with live analytics dashboards.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Theme Customization",
    description: "Customize colors, fonts, and layouts to match your event's unique style.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.707l3.293-3.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L14 10.727M7 21l5.485-5.485" />
      </svg>
    ),
  },
  {
    title: "Share Anywhere",
    description: "Generate QR codes and shareable links to reach guests wherever they are.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-dash-bg to-rose-50" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
            Create beautiful invitation websites
          </h1>
          <p className="mt-6 text-lg text-dash-muted md:text-xl">
            Build, customize, and share stunning event websites for any occasion.
            Manage guests, track RSVPs, and keep everything in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="secondary">Sign in</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-dash-text">Everything you need</h2>
          <p className="mt-2 text-dash-muted">Powerful features to make your event unforgettable.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-dash-primary/10 text-dash-primary">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-dash-text">{feature.title}</h3>
              <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-4xl px-4 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-dash-primary to-dash-primary-hover px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-2 text-white/90">Create your first invitation website in minutes.</p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button size="lg" variant="secondary">Start building</Button>
          </Link>
        </div>
      </section>

      <div className="mt-auto">
        <SiteFooter />
      </div>
    </div>
  );
}
