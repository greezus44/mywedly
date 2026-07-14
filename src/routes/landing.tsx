import { useNavigate } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Beautiful Invitation Websites",
      description:
        "Create a stunning invitation website in minutes with our easy-to-use editor. No design skills required.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    {
      title: "Guest Management",
      description:
        "Manage your guest list, track RSVPs, and organize guests into groups for targeted invitations.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-4.553M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.144 6.144 0 0 1-1.189-2.47M15 19.128a3 3 0 0 1-5.598 1.548M5.25 6.75a2.625 2.625 0 1 0 5.25 0 2.625 2.625 0 0 0-5.25 0zm6.375 0a2.625 2.625 0 1 0 5.25 0 2.625 2.625 0 0 0-5.25 0z" />
        </svg>
      ),
    },
    {
      title: "Custom Themes",
      description:
        "Choose from beautiful preset themes or customize colors, fonts, and layouts to match your style.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l3.201-3.301V21a3.75 3.75 0 1 0 3.75-3.75H9.404l3.201-3.301a3.75 3.75 0 1 0-5.304-5.304l-3.301 3.201V4.5a3.75 3.75 0 1 0-3.75 3.75v8.4a3.75 3.75 0 0 0 5.304 5.304z" />
        </svg>
      ),
    },
    {
      title: "RSVP Tracking",
      description:
        "Collect and track RSVPs from your guests in real time. Get notified when responses come in.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
      ),
    },
    {
      title: "Schedule & Timeline",
      description:
        "Plan your event day with a detailed timeline. Keep your guests informed about what's happening and when.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      title: "Custom Pages",
      description:
        "Build custom pages with a drag-and-drop editor. Add photos, text, maps, and more to tell your story.",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader onNavigate={(path) => navigate(path)} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-dash-bg to-dash-surface py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-dash-text md:text-6xl">
            Create your perfect{" "}
            <span className="text-dash-primary">invitation website</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dash-muted">
            MyWedly helps you build a beautiful, personalized website for your special day.
            Manage guests, track RSVPs, and share your story — all in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/login")}>
              Get started free
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/#features")}>
              See features
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-dash-text">Everything you need</h2>
          <p className="mt-2 text-dash-muted">
            All the tools to plan and share your special event.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-dash-primary/10 text-dash-primary">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-dash-text">{f.title}</h3>
              <p className="mt-2 text-sm text-dash-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-dash-surface py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-dash-text">Ready to get started?</h2>
          <p className="mt-2 text-dash-muted">
            Create your free account and start building your invitation website today.
          </p>
          <Button size="lg" className="mt-6" onClick={() => navigate("/login")}>
            Sign up free
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
