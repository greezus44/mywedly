import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { guestSignin, getGuestSession } from "@/lib/guest-auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export function GuestLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setError("Wedding not found");
          setLoading(false);
          return;
        }
        setWedding(data as Wedding);
        if (getGuestSession()) {
          navigate(`/w/${slug}/home`);
        }
        setLoading(false);
      });
  }, [slug, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding) return;
    setSubmitting(true);
    setError(null);
    const { error, session } = await guestSignin(wedding.id, username.trim(), slug!);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    if (session) {
      navigate(`/w/${slug}/home`);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-parchment text-sepia">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm text-center">
        {wedding && (
          <>
            <h1 className="text-4xl md:text-5xl font-script text-onyx mb-2">
              {wedding.couple_name_one} & {wedding.couple_name_two}
            </h1>
            {wedding.wedding_date && (
              <p className="text-sepia text-sm tracking-widest uppercase mb-8">
                {new Date(wedding.wedding_date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </>
        )}
        <div className="bg-card border border-sand rounded-lg p-8 mt-6">
          <h2 className="font-serif text-xl text-onyx mb-1">Welcome</h2>
          <p className="text-sepia text-sm mb-6">Sign in with your username to view your invitation</p>
          <form onSubmit={submit} className="space-y-4 text-left">
            <div>
              <Label>Username</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                autoFocus
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
