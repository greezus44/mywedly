import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <h1 className="text-4xl font-bold text-dash-text sm:text-6xl">
              Create your dream wedding website
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-dash-muted">
              MyWedly helps you build a beautiful, personalized wedding invitation website in minutes.
              Share your story, manage guests, and collect RSVPs — all in one place.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/auth"><Button size="lg">Get Started</Button></Link>
              <Link to="/dashboard"><Button variant="secondary" size="lg">View Dashboard</Button></Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-dash-border bg-dash-surface">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-dash-primary/10">
                <svg className="h-6 w-6 text-dash-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 8H3m18 0h-3m-3 8a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-dash-text">Custom Themes</h3>
              <p className="mt-1 text-sm text-dash-muted">Choose from beautiful presets or customize every color and font.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-dash-primary/10">
                <svg className="h-6 w-6 text-dash-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-dash-text">Guest Management</h3>
              <p className="mt-1 text-sm text-dash-muted">Organize guests into groups and track RSVPs in real time.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-dash-primary/10">
                <svg className="h-6 w-6 text-dash-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-dash-text">Easy Sharing</h3>
              <p className="mt-1 text-sm text-dash-muted">Share your site with QR codes and direct links.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dash-primary/5">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-dash-text">Ready to begin?</h2>
            <p className="mt-2 text-dash-muted">Create your free account and start building your wedding website today.</p>
            <Link to="/auth" className="inline-block mt-6"><Button size="lg">Sign Up Free</Button></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
