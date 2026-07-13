import React from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dash-bg">
      <SiteHeader />
      <main>
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-dash-text mb-4">
            Invitation Websites for Any Event
          </h1>
          <p className="text-lg text-dash-muted max-w-2xl mx-auto mb-8">
            Create a beautiful invitation website for your wedding, conference, birthday, festival, or any multi-event experience.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/auth">
              <Button variant="secondary" size="lg">Sign in</Button>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Multi-Event Support", desc: "Create invitation websites with multiple events — ceremonies, receptions, dinners, and more." },
              { title: "Guest Management", desc: "Organize guests into groups, send bulk invitations, and track RSVPs all in one place." },
              { title: "Custom Pages", desc: "Build custom pages with a drag-and-drop page builder. Share your story, venue details, and more." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-dash-border bg-dash-surface p-6">
                <h3 className="text-lg font-semibold text-dash-text mb-2">{f.title}</h3>
                <p className="text-sm text-dash-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
