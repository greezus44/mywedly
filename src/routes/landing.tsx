import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-4xl font-bold text-dash-text sm:text-5xl">Create your dream wedding website</h1>
          <p className="mb-8 text-lg text-dash-muted">MyWedly helps you build a beautiful, personalised wedding site for your guests — RSVPs, wishes, custom pages, and more.</p>
          <div className="flex justify-center gap-3">
            <Link to="/auth"><Button size="lg">Get Started</Button></Link>
            <Link to="/dashboard"><Button size="lg" variant="secondary">View Dashboard</Button></Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
