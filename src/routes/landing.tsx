import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button";

export function Landing() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-primary)]/10 rounded-full mb-6">
          <Heart size={36} className="text-[var(--color-primary)]" />
        </div>
        <h1 className="font-script text-5xl text-[var(--color-primary)] mb-4">Wedding Invitation</h1>
        <p className="font-body text-lg text-[var(--color-text-muted)] mb-8">Create a beautiful digital wedding invitation for your special day.</p>
        <Link to="/host-login"><Button variant="primary" size="lg">Get Started<ArrowRight size={16} className="ml-2" /></Button></Link>
      </div>
    </div>
  );
}
