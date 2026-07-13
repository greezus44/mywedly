import React from "react";
import { Link } from "react-router-dom";
import { CalendarHeart, Users, Share2 } from "lucide-react";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-serif text-slate-900 mb-4">Create Beautiful Event Invitations</h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">Design, manage, and share stunning event websites for weddings, birthdays, corporate events, and more.</p>
          <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 text-base font-medium">Get Started Free</Link>
        </section>
        <section className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: CalendarHeart, title: "Custom Pages", desc: "Design cover, login, home, and RSVP pages with live preview." },
            { icon: Users, title: "Guest Management", desc: "Manage guests, groups, RSVPs, and wishes all in one place." },
            { icon: Share2, title: "Easy Sharing", desc: "Share with custom URLs, QR codes, and published guest pages." },
          ].map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200">
              <f.icon className="w-8 h-8 text-teal-700 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
