import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWedding } from "@/lib/use-wedding";
import { guestSignin } from "@/lib/guest-auth";

export function GuestSignin() {
  const slug = location.pathname.split("/")[2];
  const navigate = useNavigate();
  const { wedding, loading, error } = useWedding(slug);
  const [username, setUsername] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding) return;
    setSubmitting(true); setErr(null);
    const { error, session } = await guestSignin(wedding.id, username.trim());
    setSubmitting(false);
    if (error) { setErr(error); return; }
    if (session) navigate(`/w/${slug}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-script text-onyx mb-2">Welcome</h1>
        <p className="text-center text-sepia text-sm mb-8">Sign in to view your invitation</p>
        <form onSubmit={submit} className="space-y-4">
          <input type="text" placeholder="Your username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors disabled:opacity-50">{submitting ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
