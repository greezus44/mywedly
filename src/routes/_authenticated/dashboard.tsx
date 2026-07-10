import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listMyWeddings, slugify, type Wedding } from "@/lib/wedding-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Aethel" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data: weddings, isLoading } = useQuery({
    queryKey: ["weddings"],
    queryFn: listMyWeddings,
  });

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-parchment text-onyx">
      <nav className="flex justify-between items-center px-6 md:px-10 py-6 border-b border-onyx/5">
        <Link to="/" className="serif-italic text-2xl">Aethel</Link>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="eyebrow text-onyx">Weddings</Link>
          <button onClick={handleSignOut} className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-16">
        <div className="flex justify-between items-end mb-12 border-b border-onyx pb-6 flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-3">Your Atelier</p>
            <h1 className="font-serif text-5xl italic">Weddings</h1>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors"
          >
            + New Wedding
          </button>
        </div>

        {creating && <CreateWeddingModal onClose={() => setCreating(false)} />}

        {isLoading ? (
          <p className="text-onyx/60">Loading…</p>
        ) : !weddings || weddings.length === 0 ? (
          <EmptyState onCreate={() => setCreating(true)} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map((w) => (
              <WeddingCard key={w.id} wedding={w} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border border-dashed border-onyx/20 p-16 text-center">
      <p className="serif-italic text-3xl mb-4">A blank page.</p>
      <p className="text-onyx/60 mb-6 max-w-md mx-auto">
        Create your first wedding to build a site, invite guests, and begin the record.
      </p>
      <button
        onClick={onCreate}
        className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors"
      >
        + Create wedding
      </button>
    </div>
  );
}

function WeddingCard({ wedding }: { wedding: Wedding }) {
  const dateLabel = wedding.wedding_date
    ? new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Date not set";
  const days = wedding.wedding_date
    ? Math.ceil(
        (new Date(wedding.wedding_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;
  return (
    <Link
      to="/manage/$slug"
      params={{ slug: wedding.slug }}
      className="block bg-card border border-onyx/10 p-8 hover:shadow-editorial transition-shadow group"
    >
      <p className="eyebrow mb-4 text-sepia">{wedding.theme}</p>
      <h3 className="font-serif text-3xl leading-tight mb-2 italic">
        {wedding.couple_name_one} &amp; {wedding.couple_name_two}
      </h3>
      <p className="text-sm text-onyx/60 mb-6">{dateLabel}</p>
      <div className="flex justify-between items-end pt-6 border-t border-onyx/5">
        <div>
          <p className="eyebrow">Countdown</p>
          <p className="serif-italic text-2xl">
            {days === null ? "—" : days > 0 ? `${days} days` : days === 0 ? "Today" : "Past"}
          </p>
        </div>
        <span className="text-xs uppercase tracking-widest text-onyx/40 group-hover:text-onyx transition-colors">
          Manage →
        </span>
      </div>
    </Link>
  );
}

function CreateWeddingModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [nameOne, setNameOne] = useState("");
  const [nameTwo, setNameTwo] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Not signed in");
      const baseSlug = slugify(`${nameOne}-and-${nameTwo}`) || "wedding";
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase
        .from("weddings")
        .insert({
          slug,
          couple_name_one: nameOne.trim(),
          couple_name_two: nameTwo.trim(),
          wedding_date: date || null,
          location: location.trim() || null,
          created_by: userRes.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      // Seed a starting event
      await supabase.from("events").insert({
        wedding_id: data.id,
        name: "Ceremony",
        kind: "ceremony",
        starts_at: date ? new Date(date + "T16:00:00").toISOString() : null,
        venue_name: location || null,
        visibility: "public",
        sort_order: 0,
      });
      // Seed starter checklist
      const startTasks = [
        { title: "Set a budget", category: "Planning" },
        { title: "Choose your venue", category: "Planning" },
        { title: "Draft guest list", category: "Guests" },
        { title: "Send save-the-dates", category: "Invitations" },
        { title: "Book photographer", category: "Vendors" },
      ];
      await supabase.from("checklist_tasks").insert(
        startTasks.map((t, i) => ({ ...t, wedding_id: data.id, sort_order: i })),
      );
      return data as Wedding;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["weddings"] });
      toast.success("Wedding created.");
      navigate({ to: "/manage/$slug", params: { slug: data.slug } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create"),
  });

  return (
    <div className="fixed inset-0 bg-onyx/40 z-50 flex items-center justify-center p-4">
      <div className="bg-parchment max-w-lg w-full p-10 shadow-editorial">
        <p className="eyebrow mb-3">New Wedding</p>
        <h2 className="font-serif text-3xl italic mb-8">A quiet beginning.</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-2">Partner one</label>
              <input
                required
                value={nameOne}
                onChange={(e) => setNameOne(e.target.value)}
                className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
                placeholder="Ada"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Partner two</label>
              <input
                required
                value={nameTwo}
                onChange={(e) => setNameTwo(e.target.value)}
                className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
                placeholder="Grace"
              />
            </div>
          </div>
          <div>
            <label className="eyebrow block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
            />
          </div>
          <div>
            <label className="eyebrow block mb-2">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
              placeholder="Hudson Valley, New York"
            />
          </div>
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Creating…" : "Create wedding"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 border border-onyx/20 text-xs uppercase tracking-widest hover:bg-onyx/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
