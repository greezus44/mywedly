import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-4xl font-bold text-dash-text sm:text-5xl">
            Create Your Perfect <span className="text-dash-primary">Wedding Website</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dash-muted">
            MyWedly helps you build a beautiful, personalized wedding invitation website.
            Manage guests, track RSVPs, share your story, and more.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/auth"><Button size="lg">Get Started</Button></Link>
            <Link to="/dashboard"><Button variant="secondary" size="lg">View Dashboard</Button></Link>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "Customizable Themes", desc: "Choose from beautiful presets or customize every detail." },
              { title: "Guest Management", desc: "Invite guests, track RSVPs, and organize groups with ease." },
              { title: "Share Your Story", desc: "Build custom pages with a powerful block-based editor." },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border border-dash-border bg-dash-surface p-6">
                <h3 className="text-lg font-semibold text-dash-text">{f.title}</h3>
                <p className="mt-2 text-sm text-dash-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
