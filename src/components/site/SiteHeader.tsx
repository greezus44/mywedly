import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function SiteHeader() {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <nav className="flex justify-between items-center px-6 md:px-10 py-6 border-b border-onyx/5 bg-parchment">
      <Link to="/" className="font-serif italic text-2xl font-semibold tracking-tight text-onyx">
        Aethel
      </Link>
      <div className="hidden md:flex gap-10 text-xs uppercase tracking-widest font-semibold text-onyx/60">
        <a href="/#builder" className="hover:text-onyx transition-colors">The Builder</a>
        <a href="/#showcase" className="hover:text-onyx transition-colors">Showcase</a>
        <a href="/#pricing" className="hover:text-onyx transition-colors">Pricing</a>
        <a href="/#craft" className="hover:text-onyx transition-colors">Craft</a>
      </div>
      <div className="flex items-center gap-3">
        {session ? (
          <>
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex px-5 py-2 border border-onyx text-onyx text-xs uppercase tracking-widest hover:bg-onyx hover:text-parchment transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/auth"
              className="hidden sm:inline text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="px-5 py-2 bg-onyx text-parchment text-xs uppercase tracking-widest hover:bg-ink transition-colors"
            >
              Begin planning
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
