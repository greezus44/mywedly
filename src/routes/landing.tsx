import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    title: "Beautiful Templates",
    description: "Choose from dozens of professionally designed invitation templates for any occasion.",
    icon: "M12 21v-8.25M4.5 9.75 12 3l7.5 6.75M4.5 9.75h15M4.5 9.75V21h15V9.75",
  },
  {
    title: "Guest Management",
    description: "Track RSVPs, manage guest lists, and organise groups with ease.",
    icon: "M17.982 18.725A7.488 7.488 0 0 0 12 15c-2.778 0-5.293 1.51-6.982 3.725M9 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM3 20.25h18M3 3.75h18",
  },
  {
    title: "Custom Pages",
    description: "Build custom pages with our drag-and-drop page builder to tell your story.",
    icon: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
  },
  {
    title: "RSVP Tracking",
    description: "Collect RSVPs online and track responses in real-time with automatic updates.",
    icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    title: "Share Anywhere",
    description: "Share your invitation link or QR code with guests via email, text, or social media.",
    icon: "M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.769-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5h9.566m-9.566 0H3.75m9.566 5.314 9.566-5.314M3.75 6.75h16.5",
  },
  {
    title: "Analytics",
    description: "See who has visited your invitation and track engagement with built-in analytics.",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
  },
];

const TEMPLATES = [
  { name: "Classic", description: "Timeless elegance for traditional celebrations.", color: "from-amber-100 to-amber-200" },
  { name: "Modern", description: "Clean lines and contemporary styling.", color: "from-sky-100 to-sky-200" },
  { name: "Garden", description: "Natural and romantic for outdoor events.", color: "from-green-100 to-green-200" },
  { name: "Blush", description: "Soft and romantic with delicate pink tones.", color: "from-pink-100 to-pink-200" },
];

const FAQS = [
  { q: "Is MyWedly free to use?", a: "Yes! You can create and share your invitation website for free. Premium features are available on paid plans." },
  { q: "Do guests need an account?", a: "No. Guests simply enter a username provided by you to access the invitation website." },
  { q: "Can I customise the design?", a: "Absolutely. Choose from theme presets, customise colours, fonts, and build custom pages with our page builder." },
  { q: "How do I share my invitation?", a: "Share a link or QR code via email, text, or social media. Track visits with built-in analytics." },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-dash-text sm:text-5xl lg:text-6xl">
            Beautiful invitation websites
            <span className="block text-dash-primary">for your special day</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
            Create a stunning, customisable invitation website for your wedding, birthday, or any celebration.
            Manage guests, track RSVPs, and share with ease.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get started — it's free</Button>
            </Link>
            <Link to="/#features">
              <Button variant="secondary" size="lg">Learn more</Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-dash-text text-center">Everything you need</h2>
          <p className="mt-2 text-center text-dash-muted">All the tools to create and manage your perfect invitation.</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-dash-border bg-dash-surface p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-dash-primary/10">
                  <svg className="h-6 w-6 text-dash-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-dash-text">{feature.title}</h3>
                <p className="mt-2 text-sm text-dash-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="bg-dash-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-dash-text text-center">Stunning templates</h2>
            <p className="mt-2 text-center text-dash-muted">Start with a beautiful theme and make it yours.</p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATES.map((template) => (
                <div key={template.name} className="overflow-hidden rounded-lg border border-dash-border">
                  <div className={`aspect-[3/4] bg-gradient-to-br ${template.color}`} />
                  <div className="p-4">
                    <h3 className="font-semibold text-dash-text">{template.name}</h3>
                    <p className="mt-1 text-xs text-dash-muted">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="pricing" className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-dash-text">Ready to get started?</h2>
          <p className="mt-2 text-dash-muted">Create your invitation website in minutes.</p>
          <Link to="/auth" className="mt-6 inline-block">
            <Button size="lg">Create your event</Button>
          </Link>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-dash-surface py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-dash-text text-center">Frequently asked questions</h2>
            <div className="mt-10 space-y-6">
              {FAQS.map((faq) => (
                <div key={faq.q}>
                  <h3 className="text-lg font-semibold text-dash-text">{faq.q}</h3>
                  <p className="mt-2 text-sm text-dash-muted">{faq.a}</p>
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
