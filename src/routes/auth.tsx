import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Aethel" },
      { name: "description", content: "Sign in to plan your wedding with Aethel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Redirecting to your dashboard.");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment text-onyx grid lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-onyx text-parchment">
        <Link to="/" className="serif-italic text-3xl">
          Aethel
        </Link>
        <div>
          <p className="eyebrow mb-6 text-parchment/60">Volume I</p>
          <p className="font-serif text-4xl italic leading-tight max-w-md">
            "Planning is no longer a chore, it is an editorial exercise."
          </p>
        </div>
        <p className="eyebrow text-parchment/40">The Modern Curator</p>
      </aside>

      <main className="flex flex-col justify-center px-6 md:px-16 py-16">
        <div className="lg:hidden mb-10">
          <Link to="/" className="serif-italic text-2xl">
            Aethel
          </Link>
        </div>
        <p className="eyebrow mb-4">{mode === "signup" ? "Create account" : "Welcome back"}</p>
        <h1 className="font-serif text-5xl italic mb-2">
          {mode === "signup" ? "Begin the record." : "Sign in."}
        </h1>
        <p className="text-onyx/60 mb-10 max-w-md">
          {mode === "signup"
            ? "One account for every wedding you host or help plan."
            : "Continue where you left off."}
        </p>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full max-w-md py-3 border border-onyx text-xs uppercase tracking-widest hover:bg-onyx hover:text-parchment transition-colors disabled:opacity-50 mb-6"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-4 max-w-md mb-6">
          <div className="hairline flex-1" />
          <span className="eyebrow">or</span>
          <div className="hairline flex-1" />
        </div>

        <form onSubmit={handleEmail} className="max-w-md space-y-4">
          {mode === "signup" && (
            <div>
              <label className="eyebrow block mb-2">Your name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
                placeholder="Ada Lovelace"
              />
            </div>
          )}
          <div>
            <label className="eyebrow block mb-2">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
              placeholder="you@studio.com"
            />
          </div>
          <div>
            <label className="eyebrow block mb-2">Password</label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors disabled:opacity-50 mt-6"
          >
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-sm text-onyx/60 max-w-md">
          {mode === "signup" ? "Already have an account? " : "New to Aethel? "}
          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-onyx underline underline-offset-4 font-medium"
          >
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </main>
    </div>
  );
}
