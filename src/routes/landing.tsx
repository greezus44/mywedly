import { Link } from "react-router-dom";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center" style={{ backgroundColor: "#f8ecd5" }}>
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center gap-3">
            <Link to="/dashboard"><Button size="lg" variant="secondary" style={{ backgroundColor: "#f8ecd5" }}>View Dashboard</Button></Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
