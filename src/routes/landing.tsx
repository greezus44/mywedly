import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-parchment text-center px-6">
      <h1 className="text-5xl md:text-7xl font-script text-onyx mb-6">Wedding Studio</h1>
      <p className="text-sepia text-sm tracking-widest uppercase mb-10">Create beautiful wedding invitations</p>
      <Link to="/dashboard" className="bg-onyx text-parchment px-8 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Get Started</Link>
    </div>
  );
}
