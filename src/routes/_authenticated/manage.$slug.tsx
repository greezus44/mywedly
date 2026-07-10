import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getWeddingBySlug, type Wedding } from "@/lib/wedding-queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/manage/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Manage ${params.slug} — Aethel` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params }) => {
    const w = await getWeddingBySlug(params.slug);
    if (!w) throw notFound();
    return { wedding: w };
  },
  component: ManagePage,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-parchment px-4 text-center">
      <div>
        <p className="eyebrow mb-4">Not found</p>
        <h1 className="font-serif text-4xl italic mb-6">This wedding does not exist.</h1>
        <Link to="/dashboard" className="text-xs uppercase tracking-widest underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  ),
});

const TABS = ["overview", "guests", "rsvps", "events", "gallery", "guestbook", "registry", "travel", "checklist", "budget", "site"] as const;
type Tab = (typeof TABS)[number];

function ManagePage() {
  const { wedding } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-parchment text-onyx">
      <nav className="flex justify-between items-center px-6 md:px-10 py-6 border-b border-onyx/5">
        <Link to="/dashboard" className="serif-italic text-2xl">Aethel</Link>
        <div className="flex items-center gap-4">
          <Link
            to="/w/$slug"
            params={{ slug: wedding.slug }}
            target="_blank"
            className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx"
          >
            View site ↗
          </Link>
          <Link to="/dashboard" className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx">
            Dashboard
          </Link>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-8">
        <p className="eyebrow mb-3 text-sepia">The Wedding</p>
        <h1 className="font-serif text-5xl md:text-6xl italic leading-none">
          {wedding.couple_name_one} &amp; {wedding.couple_name_two}
        </h1>
        <p className="text-onyx/60 mt-3">
          {wedding.wedding_date
            ? new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            : "Date not set"}
          {wedding.location ? ` — ${wedding.location}` : ""}
        </p>
      </header>

      <div className="border-y border-onyx/10 bg-mist/30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-4 text-xs uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? "border-onyx text-onyx" : "border-transparent text-onyx/50 hover:text-onyx"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        {tab === "overview" && <OverviewTab wedding={wedding} />}
        {tab === "guests" && <GuestsTab wedding={wedding} />}
        {tab === "rsvps" && <RsvpsTab wedding={wedding} />}
        {tab === "events" && <EventsTab wedding={wedding} />}
        {tab === "gallery" && <GalleryTab wedding={wedding} />}
        {tab === "guestbook" && <GuestbookTab wedding={wedding} />}
        {tab === "registry" && <RegistryTab wedding={wedding} />}
        {tab === "travel" && <TravelTab wedding={wedding} />}
        {tab === "checklist" && <ChecklistTab wedding={wedding} />}
        {tab === "budget" && <BudgetTab wedding={wedding} />}
        {tab === "site" && <SiteTab wedding={wedding} />}
      </main>
    </div>
  );
}

// ============ OVERVIEW ============
function OverviewTab({ wedding }: { wedding: Wedding }) {
  const { data: stats } = useQuery({
    queryKey: ["overview", wedding.id],
    queryFn: async () => {
      const [guests, rsvps, events, tasks, budget] = await Promise.all([
        supabase.from("guests").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("rsvps").select("status").eq("wedding_id", wedding.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("checklist_tasks").select("is_done").eq("wedding_id", wedding.id),
        supabase.from("budget_items").select("estimated_cents,actual_cents").eq("wedding_id", wedding.id),
      ]);
      const rsvpArr = (rsvps.data ?? []) as { status: string }[];
      const accepted = rsvpArr.filter((r) => r.status === "accepted").length;
      const declined = rsvpArr.filter((r) => r.status === "declined").length;
      const pending = rsvpArr.filter((r) => r.status === "pending").length;
      const taskArr = (tasks.data ?? []) as { is_done: boolean }[];
      const done = taskArr.filter((t) => t.is_done).length;
      const budgetArr = (budget.data ?? []) as { estimated_cents: number; actual_cents: number }[];
      const estTotal = budgetArr.reduce((s, b) => s + (b.estimated_cents ?? 0), 0);
      const actTotal = budgetArr.reduce((s, b) => s + (b.actual_cents ?? 0), 0);
      return {
        guestCount: guests.count ?? 0,
        eventCount: events.count ?? 0,
        accepted,
        declined,
        pending,
        tasksDone: done,
        tasksTotal: taskArr.length,
        estTotal,
        actTotal,
      };
    },
  });

  const days = wedding.wedding_date
    ? Math.ceil(
        (new Date(wedding.wedding_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <StatCard
        big={days === null ? "—" : days > 0 ? days : days === 0 ? "0" : "past"}
        label="Days remaining"
        span={2}
      />
      <StatCard big={stats?.guestCount ?? "—"} label="Guests invited" />
      <StatCard big={stats?.eventCount ?? "—"} label="Events" />
      <StatCard
        big={`${stats?.accepted ?? 0}`}
        sub={`of ${(stats?.accepted ?? 0) + (stats?.pending ?? 0) + (stats?.declined ?? 0)} responses`}
        label="Accepted"
      />
      <StatCard big={`${stats?.pending ?? 0}`} label="Pending RSVPs" />
      <StatCard big={`${stats?.declined ?? 0}`} label="Declined" />
      <StatCard
        big={`${stats?.tasksDone ?? 0}/${stats?.tasksTotal ?? 0}`}
        label="Checklist"
        span={2}
      />
      <StatCard
        big={`$${((stats?.actTotal ?? 0) / 100).toLocaleString()}`}
        sub={`of $${((stats?.estTotal ?? 0) / 100).toLocaleString()} budgeted`}
        label="Spent"
        span={2}
      />
    </div>
  );
}

function StatCard({ big, sub, label, span }: { big: React.ReactNode; sub?: string; label: string; span?: number }) {
  return (
    <div className={`bg-card border border-onyx/10 p-6 ${span === 2 ? "md:col-span-2" : ""}`}>
      <p className="eyebrow mb-4">{label}</p>
      <p className="font-serif text-5xl italic">{big}</p>
      {sub && <p className="text-xs text-onyx/50 mt-2">{sub}</p>}
    </div>
  );
}

// ============ GUESTS ============
function GuestsTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("");
  const { data: guests } = useQuery({
    queryKey: ["guests", wedding.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const addGuest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("guests").insert({
        wedding_id: wedding.id,
        full_name: name.trim(),
        email: email.trim() || null,
        group_label: group.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName(""); setEmail(""); setGroup("");
      qc.invalidateQueries({ queryKey: ["guests", wedding.id] });
      qc.invalidateQueries({ queryKey: ["overview", wedding.id] });
      toast.success("Guest added");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteGuest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests", wedding.id] });
      qc.invalidateQueries({ queryKey: ["overview", wedding.id] });
    },
  });
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) addGuest.mutate(); }}
        className="bg-card border border-onyx/10 p-6 h-fit"
      >
        <p className="eyebrow mb-4">Add guest</p>
        <div className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Group (e.g. Family)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        </div>
        <button type="submit" disabled={addGuest.isPending} className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors disabled:opacity-50">
          Add
        </button>
      </form>
      <div className="lg:col-span-2 bg-card border border-onyx/10">
        <div className="flex justify-between items-center p-6 border-b border-onyx/10">
          <p className="eyebrow">Guest list</p>
          <span className="text-xs text-onyx/50">{guests?.length ?? 0} guests</span>
        </div>
        <ul>
          {(!guests || guests.length === 0) && <li className="p-6 text-onyx/50 text-sm">No guests yet.</li>}
          {guests?.map((g: any) => (
            <li key={g.id} className="flex items-center justify-between p-4 px-6 border-b border-onyx/5 last:border-0">
              <div>
                <p className="font-medium">{g.full_name}</p>
                <p className="text-xs text-onyx/50">{[g.email, g.group_label].filter(Boolean).join(" · ")}</p>
              </div>
              <button onClick={() => deleteGuest.mutate(g.id)} className="text-xs text-onyx/40 hover:text-destructive">
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============ RSVPS ============
function RsvpsTab({ wedding }: { wedding: Wedding }) {
  const { data: rsvps } = useQuery({
    queryKey: ["rsvps", wedding.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div className="bg-card border border-onyx/10">
      <div className="p-6 border-b border-onyx/10">
        <p className="eyebrow">RSVP responses</p>
      </div>
      <ul>
        {(!rsvps || rsvps.length === 0) && (
          <li className="p-6 text-onyx/50 text-sm">
            No RSVPs yet. Share your site: <code className="text-onyx">/w/{wedding.slug}/rsvp</code>
          </li>
        )}
        {rsvps?.map((r: any) => (
          <li key={r.id} className="flex items-center justify-between p-4 px-6 border-b border-onyx/5 last:border-0">
            <div>
              <p className="font-medium">{r.guest_name}</p>
              <p className="text-xs text-onyx/50">{[r.guest_email, r.meal_choice, r.plus_one_name && `+ ${r.plus_one_name}`].filter(Boolean).join(" · ")}</p>
              {r.message && <p className="text-xs italic text-onyx/60 mt-1">"{r.message}"</p>}
            </div>
            <RsvpBadge status={r.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
function RsvpBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    accepted: "bg-success/10 text-success",
    declined: "bg-destructive/10 text-destructive",
    pending: "bg-warning/15 text-onyx",
    tentative: "bg-onyx/5 text-onyx/60",
  };
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${map[status] ?? map.pending}`}>{status}</span>;
}

// ============ EVENTS ============
function EventsTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [when, setWhen] = useState("");
  const { data: events } = useQuery({
    queryKey: ["events", wedding.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({
        wedding_id: wedding.id,
        name: name.trim(),
        kind: "other",
        venue_name: venue.trim() || null,
        starts_at: when ? new Date(when).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setVenue(""); setWhen(""); qc.invalidateQueries({ queryKey: ["events", wedding.id] }); toast.success("Event added"); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events", wedding.id] }),
  });
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="bg-card border border-onyx/10 p-6 h-fit">
        <p className="eyebrow mb-4">Add event</p>
        <div className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Reception" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        </div>
        <button type="submit" className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Add</button>
      </form>
      <ul className="lg:col-span-2 bg-card border border-onyx/10 divide-y divide-onyx/5">
        {events?.length === 0 && <li className="p-6 text-sm text-onyx/50">No events yet.</li>}
        {events?.map((e: any) => (
          <li key={e.id} className="flex justify-between items-start p-6">
            <div>
              <p className="serif-italic text-2xl">{e.name}</p>
              <p className="text-xs text-onyx/50 mt-1">
                {e.starts_at ? new Date(e.starts_at).toLocaleString() : "Time TBD"} {e.venue_name ? `— ${e.venue_name}` : ""}
              </p>
            </div>
            <button onClick={() => del.mutate(e.id)} className="text-xs text-onyx/40 hover:text-destructive">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ GALLERY / GUESTBOOK / REGISTRY / TRAVEL / CHECKLIST / BUDGET (simple CRUD) ============
function GalleryTab({ wedding }: { wedding: Wedding }) {
  return <SimpleList
    wedding={wedding}
    table="gallery_items"
    queryKey="gallery"
    label="Photo"
    fields={[
      { key: "image_url", placeholder: "Image URL (https://…)", required: true },
      { key: "caption", placeholder: "Caption" },
    ]}
    render={(item: any) => (
      <div className="flex items-center gap-4">
        <img src={item.image_url} alt="" className="w-16 h-16 object-cover grayscale" />
        <div><p className="text-sm font-medium">{item.caption || "Untitled"}</p></div>
      </div>
    )}
  />;
}
function GuestbookTab({ wedding }: { wedding: Wedding }) {
  return <SimpleList
    wedding={wedding} table="guestbook_entries" queryKey="guestbook" label="Entry"
    fields={[{ key: "author_name", placeholder: "Author", required: true }, { key: "message", placeholder: "Message", required: true }]}
    render={(item: any) => (<div><p className="text-sm font-medium">{item.author_name}</p><p className="text-sm italic text-onyx/70">"{item.message}"</p></div>)}
  />;
}
function RegistryTab({ wedding }: { wedding: Wedding }) {
  return <SimpleList
    wedding={wedding} table="registry_items" queryKey="registry" label="Item"
    fields={[{ key: "title", placeholder: "Title", required: true }, { key: "url", placeholder: "URL" }, { key: "description", placeholder: "Description" }]}
    render={(item: any) => (<div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-onyx/50">{item.url || item.description}</p></div>)}
  />;
}
function TravelTab({ wedding }: { wedding: Wedding }) {
  return <SimpleList
    wedding={wedding} table="travel_items" queryKey="travel" label="Recommendation"
    fields={[{ key: "title", placeholder: "Title", required: true }, { key: "address", placeholder: "Address" }, { key: "description", placeholder: "Notes" }]}
    render={(item: any) => (<div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-onyx/50">{[item.address, item.description].filter(Boolean).join(" · ")}</p></div>)}
  />;
}
function ChecklistTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const { data: tasks } = useQuery({
    queryKey: ["checklist", wedding.id],
    queryFn: async () => (await supabase.from("checklist_tasks").select("*").eq("wedding_id", wedding.id).order("sort_order")).data ?? [],
  });
  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      await supabase.from("checklist_tasks").update({ is_done: done }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["checklist", wedding.id] }); qc.invalidateQueries({ queryKey: ["overview", wedding.id] }); },
  });
  const add = useMutation({
    mutationFn: async () => { await supabase.from("checklist_tasks").insert({ wedding_id: wedding.id, title: title.trim(), category: category.trim() || null }); },
    onSuccess: () => { setTitle(""); setCategory(""); qc.invalidateQueries({ queryKey: ["checklist", wedding.id] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("checklist_tasks").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist", wedding.id] }),
  });
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) add.mutate(); }} className="bg-card border border-onyx/10 p-6 h-fit">
        <p className="eyebrow mb-4">New task</p>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="w-full border-b border-onyx/20 bg-transparent py-2 mb-3 outline-none focus:border-onyx" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <button className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Add</button>
      </form>
      <ul className="lg:col-span-2 bg-card border border-onyx/10 divide-y divide-onyx/5">
        {tasks?.length === 0 && <li className="p-6 text-sm text-onyx/50">No tasks.</li>}
        {tasks?.map((t: any) => (
          <li key={t.id} className="flex items-center justify-between p-4 px-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={t.is_done} onChange={(e) => toggle.mutate({ id: t.id, done: e.target.checked })} className="size-4" />
              <div>
                <p className={`text-sm ${t.is_done ? "line-through text-onyx/40" : ""}`}>{t.title}</p>
                {t.category && <p className="text-[10px] uppercase tracking-widest text-onyx/40">{t.category}</p>}
              </div>
            </label>
            <button onClick={() => del.mutate(t.id)} className="text-xs text-onyx/40 hover:text-destructive">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
function BudgetTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [category, setCategory] = useState("");
  const [label, setLabel] = useState("");
  const [estimated, setEstimated] = useState("");
  const [actual, setActual] = useState("");
  const { data: items } = useQuery({
    queryKey: ["budget", wedding.id],
    queryFn: async () => (await supabase.from("budget_items").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false })).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      await supabase.from("budget_items").insert({
        wedding_id: wedding.id,
        category: category.trim(), label: label.trim(),
        estimated_cents: Math.round(parseFloat(estimated || "0") * 100),
        actual_cents: Math.round(parseFloat(actual || "0") * 100),
      });
    },
    onSuccess: () => { setCategory(""); setLabel(""); setEstimated(""); setActual(""); qc.invalidateQueries({ queryKey: ["budget", wedding.id] }); qc.invalidateQueries({ queryKey: ["overview", wedding.id] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("budget_items").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget", wedding.id] }),
  });
  const totalEst = (items ?? []).reduce((s: number, b: any) => s + b.estimated_cents, 0);
  const totalAct = (items ?? []).reduce((s: number, b: any) => s + b.actual_cents, 0);
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); if (category.trim() && label.trim()) add.mutate(); }} className="bg-card border border-onyx/10 p-6 h-fit">
        <p className="eyebrow mb-4">New line item</p>
        <input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (Venue)" className="w-full border-b border-onyx/20 bg-transparent py-2 mb-3 outline-none focus:border-onyx" />
        <input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Deposit)" className="w-full border-b border-onyx/20 bg-transparent py-2 mb-3 outline-none focus:border-onyx" />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" step="0.01" value={estimated} onChange={(e) => setEstimated(e.target.value)} placeholder="Estimated $" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input type="number" step="0.01" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Actual $" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        </div>
        <button className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Add</button>
      </form>
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <StatCard big={`$${(totalEst/100).toLocaleString()}`} label="Estimated total" />
          <StatCard big={`$${(totalAct/100).toLocaleString()}`} label="Actual spent" />
        </div>
        <ul className="bg-card border border-onyx/10 divide-y divide-onyx/5">
          {items?.length === 0 && <li className="p-6 text-sm text-onyx/50">No line items.</li>}
          {items?.map((b: any) => (
            <li key={b.id} className="flex justify-between items-center p-4 px-6">
              <div>
                <p className="eyebrow">{b.category}</p>
                <p className="text-sm font-medium">{b.label}</p>
              </div>
              <div className="text-right">
                <p className="serif-italic text-lg">${(b.actual_cents/100).toLocaleString()}</p>
                <p className="text-xs text-onyx/40">of ${(b.estimated_cents/100).toLocaleString()}</p>
              </div>
              <button onClick={() => del.mutate(b.id)} className="ml-4 text-xs text-onyx/40 hover:text-destructive">Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SiteTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [story, setStory] = useState(wedding.story ?? "");
  const [heroUrl, setHeroUrl] = useState(wedding.hero_image_url ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({ story, hero_image_url: heroUrl || null }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Site updated"); },
    onError: (e) => toast.error(e.message),
  });
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/w/${wedding.slug}` : `/w/${wedding.slug}`;
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-card border border-onyx/10 p-8">
        <p className="eyebrow mb-4">Public site</p>
        <p className="text-sm text-onyx/60 mb-2">Your site is live at:</p>
        <div className="flex gap-2 items-center mb-6">
          <code className="text-xs bg-mist px-3 py-2 flex-1 overflow-x-auto">{shareUrl}</code>
          <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied"); }} className="text-xs uppercase tracking-widest border border-onyx px-3 py-2 hover:bg-onyx hover:text-parchment">Copy</button>
        </div>
        <Link to="/w/$slug" params={{ slug: wedding.slug }} target="_blank" className="text-xs uppercase tracking-widest text-onyx hover:text-sepia">
          Open site ↗
        </Link>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="bg-card border border-onyx/10 p-8">
        <p className="eyebrow mb-4">Edit content</p>
        <label className="eyebrow block mb-2">Hero image URL</label>
        <input value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="https://…" className="w-full border-b border-onyx/20 bg-transparent py-2 mb-4 outline-none focus:border-onyx" />
        <label className="eyebrow block mb-2">Your story</label>
        <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={6} placeholder="Tell your guests how it began…" className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
        <button className="mt-6 bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Save</button>
      </form>
    </div>
  );
}

// ============ SimpleList primitive ============
function SimpleList({
  wedding, table, queryKey, label, fields, render,
}: {
  wedding: Wedding; table: string; queryKey: string; label: string;
  fields: { key: string; placeholder: string; required?: boolean }[];
  render: (item: any) => React.ReactNode;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const { data: items } = useQuery({
    queryKey: [queryKey, wedding.id],
    queryFn: async () => (await (supabase as any).from(table).select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false })).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      const payload: any = { wedding_id: wedding.id };
      for (const f of fields) payload[f.key] = values[f.key] || null;
      const { error } = await (supabase as any).from(table).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { setValues({}); qc.invalidateQueries({ queryKey: [queryKey, wedding.id] }); toast.success(`${label} added`); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from(table).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, wedding.id] }),
  });
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form
        onSubmit={(e) => { e.preventDefault(); const requiredOk = fields.filter((f) => f.required).every((f) => (values[f.key] ?? "").trim()); if (requiredOk) add.mutate(); }}
        className="bg-card border border-onyx/10 p-6 h-fit"
      >
        <p className="eyebrow mb-4">New {label}</p>
        <div className="space-y-3">
          {fields.map((f) => (
            <input
              key={f.key}
              required={f.required}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
            />
          ))}
        </div>
        <button className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Add</button>
      </form>
      <ul className="lg:col-span-2 bg-card border border-onyx/10 divide-y divide-onyx/5">
        {items?.length === 0 && <li className="p-6 text-sm text-onyx/50">No entries yet.</li>}
        {items?.map((item: any) => (
          <li key={item.id} className="flex items-center justify-between p-4 px-6">
            {render(item)}
            <button onClick={() => del.mutate(item.id)} className="text-xs text-onyx/40 hover:text-destructive ml-4">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
