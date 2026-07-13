import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, type Wedding } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

export function DashboardLayout() {
  const navigate = useNavigate();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate("/"); return; }
      supabase.from("weddings").select("*").eq("created_by", data.user.id).then(({ data: rows }) => {
        setWeddings((rows as Wedding[]) ?? []);
        setLoading(false);
      });
    });
  }, [navigate]);

  const createWedding = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const slug = `wedding-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from("weddings").insert({
      slug,
      couple_name_one: "First",
      couple_name_two: "Second",
      created_by: user.user.id,
      content: {},
      signin_helper: {},
    }).select().single();
    if (!error && data) navigate(`/manage/${(data as Wedding).slug}`);
  };

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-onyx/10 bg-parchment px-6 py-4 flex items-center justify-between">
        <h1 className="font-serif text-xl text-onyx">Wedding Studio</h1>
        <button onClick={() => { void signOut(); navigate("/"); }} className="text-sepia text-sm hover:text-onyx">Sign Out</button>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-serif text-onyx">Your Weddings</h2>
          <button onClick={createWedding} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">New Wedding</button>
        </div>
        {loading ? (
          <p className="text-sepia">Loading…</p>
        ) : weddings.length === 0 ? (
          <p className="text-sepia/60 italic">No weddings yet. Create one to get started.</p>
        ) : (
          <div className="grid gap-4">
            {weddings.map((w) => (
              <Link key={w.id} to={`/manage/${w.slug}`} className="block border border-onyx/10 bg-card p-6 rounded-md hover:border-sepia/40 transition-colors">
                <h3 className="font-serif text-lg text-onyx">{w.couple_name_one} & {w.couple_name_two}</h3>
                <p className="text-sepia text-sm">/{w.slug}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
