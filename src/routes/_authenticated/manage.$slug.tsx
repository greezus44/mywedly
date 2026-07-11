import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getWeddingBySlug, slugify, type Wedding, type WeddingTheme } from "@/lib/wedding-queries";
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
        <Link to="/dashboard" className="text-xs uppercase tracking-widest underline">Back to dashboard</Link>
      </div>
    </div>
  ),
});

const TABS = [
  "overview", "access", "guests", "groups", "events", "invites",
  "rsvps", "invitation", "information", "signin", "pages",
  "gallery", "guestbook", "travel", "theme", "site",
] as const;
type Tab = (typeof TABS)[number];

function ManagePage() {
  const { wedding } = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen bg-parchment text-onyx">
      <nav className="flex justify-between items-center px-6 md:px-10 py-6 border-b border-onyx/5">
        <Link to="/dashboard" className="serif-italic text-2xl">Aethel</Link>
        <div className="flex items-center gap-4">
          <Link to="/w/$slug" params={{ slug: wedding.slug }} target="_blank"
            className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx">View site ↗</Link>
          <Link to="/dashboard" className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx">Dashboard</Link>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-8">
        <p className="eyebrow mb-3 text-sepia">The Wedding</p>
        <h1 className="font-serif text-5xl md:text-6xl italic leading-none">
          {wedding.couple_name_one} &amp; {wedding.couple_name_two}
        </h1>
        <p className="text-onyx/60 mt-3">
          {wedding.wedding_date
            ? new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
            : "Date not set"}
          {wedding.location ? ` — ${wedding.location}` : ""}
        </p>
      </header>

      <div className="border-y border-onyx/10 bg-mist/30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-4 text-xs uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? "border-onyx text-onyx" : "border-transparent text-onyx/50 hover:text-onyx"
              }`}>{t}</button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        {tab === "overview" && <OverviewTab wedding={wedding} />}
        {tab === "access" && <AccessTab wedding={wedding} />}
        {tab === "guests" && <GuestsTab wedding={wedding} />}
        {tab === "groups" && <GroupsTab wedding={wedding} />}
        {tab === "events" && <EventsTab wedding={wedding} />}
        {tab === "invites" && <InvitesTab wedding={wedding} />}
        {tab === "rsvps" && <RsvpsTab wedding={wedding} />}
        {tab === "invitation" && <InvitationEditor wedding={wedding} />}
        {tab === "information" && <InfoEditor wedding={wedding} />}
        {tab === "signin" && <SigninEditor wedding={wedding} />}
        {tab === "pages" && <PagesTab wedding={wedding} />}
        {tab === "gallery" && <GalleryTab wedding={wedding} />}
        {tab === "guestbook" && <GuestbookTab wedding={wedding} />}
        {tab === "travel" && <TravelTab wedding={wedding} />}
        {tab === "theme" && <ThemeTab wedding={wedding} />}
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
      const [guests, rsvps, events] = await Promise.all([
        supabase.from("guests").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
        supabase.from("rsvps").select("status").eq("wedding_id", wedding.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
      ]);
      const rsvpArr = (rsvps.data ?? []) as { status: string }[];
      return {
        guestCount: guests.count ?? 0,
        eventCount: events.count ?? 0,
        accepted: rsvpArr.filter((r) => r.status === "accepted").length,
        declined: rsvpArr.filter((r) => r.status === "declined").length,
        pending: rsvpArr.filter((r) => r.status === "pending").length,
      };
    },
  });
  const days = wedding.wedding_date
    ? Math.ceil((new Date(wedding.wedding_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  return (
    <div className="grid md:grid-cols-4 gap-6">
      <StatCard big={days === null ? "—" : days > 0 ? days : days === 0 ? "0" : "past"} label="Days remaining" span={2} />
      <StatCard big={stats?.guestCount ?? "—"} label="Guests invited" />
      <StatCard big={stats?.eventCount ?? "—"} label="Events" />
      <StatCard big={`${stats?.accepted ?? 0}`} label="Accepted" />
      <StatCard big={`${stats?.pending ?? 0}`} label="Pending" />
      <StatCard big={`${stats?.declined ?? 0}`} label="Declined" />
    </div>
  );
}

function StatCard({ big, label, span }: { big: React.ReactNode; sub?: string; label: string; span?: number }) {
  return (
    <div className={`bg-card border border-onyx/10 p-6 ${span === 2 ? "md:col-span-2" : ""}`}>
      <p className="eyebrow mb-4">{label}</p>
      <p className="font-serif text-5xl italic">{big}</p>
    </div>
  );
}

// ============ ACCESS (guest login config) ============
function AccessTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"shared" | "per_guest" | "none">(wedding.password_mode ?? "shared");
  const [password, setPassword] = useState(wedding.guest_password ?? "");
  const [helper, setHelper] = useState(wedding.signin_helper ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({
        password_mode: mode,
        guest_password: mode === "shared" ? (password || null) : null,
        signin_helper: helper || null,
      }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Access settings saved"); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-2xl bg-card border border-onyx/10 p-8 space-y-6">
      <div>
        <p className="eyebrow mb-2">Guest login mode</p>
        <div className="grid gap-3">
          {[
            { v: "shared", t: "Shared password", d: "All guests use the same password below." },
            { v: "per_guest", t: "Per-guest access code", d: "Each guest gets a unique code (set in Guests tab)." },
            { v: "none", t: "Name only", d: "Guests only enter their name — no password." },
          ].map((opt) => (
            <label key={opt.v} className={`border p-4 flex gap-3 cursor-pointer ${mode === opt.v ? "border-onyx bg-mist/30" : "border-onyx/15"}`}>
              <input type="radio" name="mode" checked={mode === opt.v} onChange={() => setMode(opt.v as any)} />
              <div>
                <p className="text-sm font-medium">{opt.t}</p>
                <p className="text-xs text-onyx/60">{opt.d}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      {mode === "shared" && (
        <div>
          <label className="eyebrow block mb-2">Shared password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. hazlyn2026" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        </div>
      )}
      <div>
        <label className="eyebrow block mb-2">Helper text on sign-in page</label>
        <textarea value={helper} onChange={(e) => setHelper(e.target.value)} rows={3}
          placeholder="e.g. Please find your name and password in the message sent to you."
          className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
      </div>
      <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Save</button>
    </form>
  );
}

// ============ GUESTS ============
function GuestsTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [groupId, setGroupId] = useState("");
  const { data: guests } = useQuery({
    queryKey: ["guests", wedding.id],
    queryFn: async () => (await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: groups } = useQuery({
    queryKey: ["groups", wedding.id],
    queryFn: async () => (await supabase.from("guest_groups").select("*").eq("wedding_id", wedding.id).order("sort_order")).data ?? [],
  });
  const addGuest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("guests").insert({
        wedding_id: wedding.id,
        full_name: name.trim(),
        email: email.trim() || null,
        access_code: code.trim() || null,
        group_id: groupId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setEmail(""); setCode(""); setGroupId(""); qc.invalidateQueries({ queryKey: ["guests", wedding.id] }); toast.success("Guest added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateGuest = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("guests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guests", wedding.id] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("guests").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guests", wedding.id] }),
  });
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) addGuest.mutate(); }} className="bg-card border border-onyx/10 p-6 h-fit">
        <p className="eyebrow mb-4">Add guest</p>
        <div className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Access code (if per-guest login)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
            className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx">
            <option value="">No group</option>
            {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <button className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">Add</button>
      </form>
      <div className="lg:col-span-2 bg-card border border-onyx/10">
        <div className="flex justify-between items-center p-6 border-b border-onyx/10">
          <p className="eyebrow">Guest list</p>
          <span className="text-xs text-onyx/50">{guests?.length ?? 0} guests</span>
        </div>
        <ul>
          {(!guests || guests.length === 0) && <li className="p-6 text-onyx/50 text-sm">No guests yet.</li>}
          {guests?.map((g: any) => (
            <li key={g.id} className="p-4 px-6 border-b border-onyx/5 last:border-0">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{g.full_name}</p>
                  <p className="text-xs text-onyx/50">
                    {[g.email, g.access_code && `code: ${g.access_code}`, (groups ?? []).find((gr: any) => gr.id === g.group_id)?.name]
                      .filter(Boolean).join(" · ")}
                  </p>
                </div>
                <select value={g.group_id ?? ""} onChange={(e) => updateGuest.mutate({ id: g.id, patch: { group_id: e.target.value || null } })}
                  className="text-xs border border-onyx/20 bg-transparent px-2 py-1">
                  <option value="">No group</option>
                  {(groups ?? []).map((gr: any) => <option key={gr.id} value={gr.id}>{gr.name}</option>)}
                </select>
                <button onClick={() => del.mutate(g.id)} className="text-xs text-onyx/40 hover:text-destructive">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============ GROUPS ============
function GroupsTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: groups } = useQuery({
    queryKey: ["groups", wedding.id],
    queryFn: async () => (await supabase.from("guest_groups").select("*").eq("wedding_id", wedding.id).order("sort_order")).data ?? [],
  });
  const { data: events } = useQuery({
    queryKey: ["events", wedding.id],
    queryFn: async () => (await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at")).data ?? [],
  });
  const { data: groupInvites } = useQuery({
    queryKey: ["group-invites", wedding.id],
    queryFn: async () => {
      const { data } = await supabase.from("group_event_invites").select("group_id, event_id");
      return (data ?? []) as { group_id: string; event_id: string }[];
    },
  });
  const add = useMutation({
    mutationFn: async () => { await supabase.from("guest_groups").insert({ wedding_id: wedding.id, name: name.trim() }); },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["groups", wedding.id] }); toast.success("Group added"); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("guest_groups").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups", wedding.id] }),
  });
  const toggle = useMutation({
    mutationFn: async ({ groupId, eventId, on }: { groupId: string; eventId: string; on: boolean }) => {
      if (on) {
        await supabase.from("group_event_invites").insert({ group_id: groupId, event_id: eventId });
      } else {
        await supabase.from("group_event_invites").delete().eq("group_id", groupId).eq("event_id", eventId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-invites", wedding.id] }),
  });
  return (
    <div className="space-y-8">
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="bg-card border border-onyx/10 p-6 flex gap-3 items-end">
        <div className="flex-1">
          <p className="eyebrow mb-2">New group</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bride's family, Friends, VIP…"
            className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        </div>
        <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Add</button>
      </form>
      {(groups ?? []).length === 0 && <p className="text-sm text-onyx/50">No groups yet.</p>}
      {(groups ?? []).map((g: any) => (
        <div key={g.id} className="bg-card border border-onyx/10 p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="serif-italic text-2xl">{g.name}</p>
            <button onClick={() => del.mutate(g.id)} className="text-xs text-onyx/40 hover:text-destructive">Remove group</button>
          </div>
          <p className="eyebrow mb-3">Invite this group to</p>
          <div className="flex flex-wrap gap-2">
            {(events ?? []).length === 0 && <p className="text-sm text-onyx/50">No events yet — add events first.</p>}
            {(events ?? []).map((ev: any) => {
              const on = !!groupInvites?.find((gi) => gi.group_id === g.id && gi.event_id === ev.id);
              return (
                <button key={ev.id} onClick={() => toggle.mutate({ groupId: g.id, eventId: ev.id, on: !on })}
                  className={`text-xs px-3 py-2 border transition-colors ${on ? "bg-onyx text-parchment border-onyx" : "border-onyx/20 hover:border-onyx"}`}>
                  {ev.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ EVENTS ============
function EventsTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [when, setWhen] = useState("");
  const { data: events } = useQuery({
    queryKey: ["events", wedding.id],
    queryFn: async () => (await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      await supabase.from("events").insert({
        wedding_id: wedding.id, name: name.trim(), kind: "other",
        venue_name: venue.trim() || null,
        starts_at: when ? new Date(when).toISOString() : null,
      });
    },
    onSuccess: () => { setName(""); setVenue(""); setWhen(""); qc.invalidateQueries({ queryKey: ["events", wedding.id] }); toast.success("Event added"); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("events").delete().eq("id", id); },
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
        <button className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink">Add</button>
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

// ============ INVITES (per-guest event assignment) ============
function InvitesTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const { data: guests } = useQuery({
    queryKey: ["guests", wedding.id],
    queryFn: async () => (await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("full_name")).data ?? [],
  });
  const { data: events } = useQuery({
    queryKey: ["events", wedding.id],
    queryFn: async () => (await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at")).data ?? [],
  });
  const { data: invites } = useQuery({
    queryKey: ["guest-invites", wedding.id],
    queryFn: async () => {
      const { data } = await supabase.from("guest_event_invites").select("guest_id, event_id");
      return (data ?? []) as { guest_id: string; event_id: string }[];
    },
  });
  const { data: groupInvites } = useQuery({
    queryKey: ["group-invites", wedding.id],
    queryFn: async () => (await supabase.from("group_event_invites").select("group_id, event_id")).data ?? [],
  });
  const toggle = useMutation({
    mutationFn: async ({ guestId, eventId, on }: { guestId: string; eventId: string; on: boolean }) => {
      if (on) await supabase.from("guest_event_invites").insert({ guest_id: guestId, event_id: eventId });
      else await supabase.from("guest_event_invites").delete().eq("guest_id", guestId).eq("event_id", eventId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guest-invites", wedding.id] }),
  });
  if (!guests?.length || !events?.length) {
    return <p className="text-sm text-onyx/50">Add guests and events first.</p>;
  }
  return (
    <div className="bg-card border border-onyx/10 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-mist/40 text-onyx/60 text-[10px] uppercase tracking-widest">
          <tr>
            <th className="text-left p-3">Guest</th>
            {events.map((e: any) => <th key={e.id} className="p-3 text-center">{e.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {guests.map((g: any) => (
            <tr key={g.id} className="border-t border-onyx/5">
              <td className="p-3">
                <p className="font-medium">{g.full_name}</p>
              </td>
              {events.map((e: any) => {
                const direct = !!invites?.find((i) => i.guest_id === g.id && i.event_id === e.id);
                const viaGroup = !!g.group_id && !!(groupInvites as any[])?.find((gi) => gi.group_id === g.group_id && gi.event_id === e.id);
                const on = direct || viaGroup;
                return (
                  <td key={e.id} className="p-3 text-center">
                    <button
                      onClick={() => toggle.mutate({ guestId: g.id, eventId: e.id, on: !direct })}
                      title={viaGroup && !direct ? "Invited via group" : ""}
                      className={`w-8 h-8 rounded border-2 ${on
                        ? viaGroup && !direct ? "bg-onyx/40 border-onyx/40 text-parchment" : "bg-onyx border-onyx text-parchment"
                        : "border-onyx/20 hover:border-onyx"}`}>
                      {on ? "✓" : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="p-4 text-xs text-onyx/50">Filled squares = invited. Faded = inherited from group.</p>
    </div>
  );
}

// ============ RSVPS ============
function RsvpsTab({ wedding }: { wedding: Wedding }) {
  const { data: rsvps } = useQuery({
    queryKey: ["rsvps", wedding.id],
    queryFn: async () => (await supabase.from("rsvps").select("*, events(name)").eq("wedding_id", wedding.id).order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="bg-card border border-onyx/10">
      <div className="p-6 border-b border-onyx/10"><p className="eyebrow">RSVP responses</p></div>
      <ul>
        {(!rsvps || rsvps.length === 0) && <li className="p-6 text-onyx/50 text-sm">No RSVPs yet.</li>}
        {rsvps?.map((r: any) => (
          <li key={r.id} className="flex items-center justify-between p-4 px-6 border-b border-onyx/5 last:border-0">
            <div>
              <p className="font-medium">{r.guest_name}</p>
              <p className="text-xs text-onyx/50">{r.events?.name ?? "—"}</p>
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
    accepted: "bg-success/10 text-success", declined: "bg-destructive/10 text-destructive",
    pending: "bg-warning/15 text-onyx", tentative: "bg-onyx/5 text-onyx/60",
  };
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${map[status] ?? map.pending}`}>{status}</span>;
}

// ============ CONTENT EDITORS (Invitation / Info / Sign-in) ============
function ContentEditor({
  wedding, title, fields,
}: {
  wedding: Wedding; title: string;
  fields: Array<{ key: string; label: string; type?: "text" | "textarea"; placeholder?: string; rows?: number }>;
}) {
  const qc = useQueryClient();
  const initial: Record<string, string> = {};
  const content = (wedding.content ?? {}) as Record<string, any>;
  fields.forEach((f) => (initial[f.key] = content[f.key] ?? ""));
  const [vals, setVals] = useState(initial);
  const save = useMutation({
    mutationFn: async () => {
      const merged = { ...content };
      for (const f of fields) merged[f.key] = vals[f.key] || null;
      const { error } = await supabase.from("weddings").update({ content: merged }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Saved"); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-3xl bg-card border border-onyx/10 p-8 space-y-6">
      <p className="eyebrow">{title}</p>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="eyebrow block mb-2">{f.label}</label>
          {f.type === "textarea" ? (
            <textarea value={vals[f.key]} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder} rows={f.rows ?? 6}
              className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
          ) : (
            <input value={vals[f.key]} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          )}
        </div>
      ))}
      <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
    </form>
  );
}

function InvitationEditor({ wedding }: { wedding: Wedding }) {
  return <ContentEditor wedding={wedding} title="Invitation page content" fields={[
    { key: "invitation_bismillah", label: "Top ornament / Bismillah (optional)", placeholder: "بِسْمِ اللَّهِ..." },
    { key: "invitation_heading", label: "Heading", placeholder: "YA-QADHI AL-HAJAT" },
    { key: "parents", label: "Parents block", type: "textarea", rows: 4 },
    { key: "invitation_text", label: "Invitation text", type: "textarea", rows: 4 },
    { key: "closing_text", label: "Closing text", type: "textarea", rows: 3 },
    { key: "invitation_cta_label", label: "Button label", placeholder: "RSVP" },
  ]} />;
}
function InfoEditor({ wedding }: { wedding: Wedding }) {
  return <ContentEditor wedding={wedding} title="Information page content" fields={[
    { key: "info_heading", label: "Heading", placeholder: "DOA" },
    { key: "info_image_url", label: "Image URL (optional)", placeholder: "https://…" },
    { key: "info_body", label: "Body text", type: "textarea", rows: 10 },
  ]} />;
}
function SigninEditor({ wedding }: { wedding: Wedding }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-onyx/60 max-w-2xl">Password mode and helper text live in the <span className="font-medium">Access</span> tab.</p>
    </div>
  );
}

// ============ CUSTOM PAGES ============
function PagesTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState("");
  const [inline, setInline] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const { data: pages } = useQuery({
    queryKey: ["pages", wedding.id],
    queryFn: async () => (await supabase.from("custom_pages").select("*").eq("wedding_id", wedding.id).order("sort_order")).data ?? [],
  });
  const reset = () => { setTitle(""); setSlug(""); setBody(""); setCover(""); setInline(""); setEditing(null); };
  const save = useMutation({
    mutationFn: async () => {
      const finalSlug = (slug.trim() || slugify(title.trim()));
      const payload = {
        wedding_id: wedding.id,
        title: title.trim(),
        slug: finalSlug,
        body,
        cover_image_url: cover || null,
        inline_image_url: inline || null,
      };
      if (editing) {
        const { error } = await supabase.from("custom_pages").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_pages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { reset(); qc.invalidateQueries({ queryKey: ["pages", wedding.id] }); toast.success("Page saved"); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("custom_pages").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages", wedding.id] }),
  });
  const load = (p: any) => {
    setEditing(p.id); setTitle(p.title); setSlug(p.slug); setBody(p.body ?? "");
    setCover(p.cover_image_url ?? ""); setInline(p.inline_image_url ?? "");
  };
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) save.mutate(); }} className="bg-card border border-onyx/10 p-6 h-fit space-y-3">
        <p className="eyebrow">{editing ? "Edit page" : "New page"}</p>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title (e.g. Accommodation)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="URL slug (auto)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="Cover image URL (optional)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={inline} onChange={(e) => setInline(e.target.value)} placeholder="Inline image URL (optional)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Page body…" className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
        <div className="flex gap-2">
          <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">{editing ? "Update" : "Add page"}</button>
          {editing && <button type="button" onClick={reset} className="text-xs uppercase tracking-widest px-4">Cancel</button>}
        </div>
      </form>
      <ul className="lg:col-span-2 bg-card border border-onyx/10 divide-y divide-onyx/5">
        {pages?.length === 0 && <li className="p-6 text-sm text-onyx/50">No custom pages yet.</li>}
        {pages?.map((p: any) => (
          <li key={p.id} className="flex justify-between items-center p-4 px-6">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-onyx/50">/w/{wedding.slug}/p/{p.slug}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => load(p)} className="text-xs text-onyx/60 hover:text-onyx">Edit</button>
              <button onClick={() => del.mutate(p.id)} className="text-xs text-onyx/40 hover:text-destructive">Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ GALLERY / GUESTBOOK / TRAVEL ============
function GalleryTab({ wedding }: { wedding: Wedding }) {
  return <SimpleList wedding={wedding} table="gallery_items" queryKey="gallery" label="Photo"
    fields={[{ key: "image_url", placeholder: "Image URL (https://…)", required: true }, { key: "caption", placeholder: "Caption" }]}
    render={(item: any) => (
      <div className="flex items-center gap-4">
        <img src={item.image_url} alt="" className="w-16 h-16 object-cover grayscale" />
        <div><p className="text-sm font-medium">{item.caption || "Untitled"}</p></div>
      </div>
    )} />;
}
function GuestbookTab({ wedding }: { wedding: Wedding }) {
  return <SimpleList wedding={wedding} table="guestbook_entries" queryKey="guestbook" label="Entry"
    fields={[{ key: "author_name", placeholder: "Author", required: true }, { key: "message", placeholder: "Message", required: true }]}
    render={(item: any) => (<div><p className="text-sm font-medium">{item.author_name}</p><p className="text-sm italic text-onyx/70">"{item.message}"</p></div>)} />;
}
function TravelTab({ wedding }: { wedding: Wedding }) {
  return <SimpleList wedding={wedding} table="travel_items" queryKey="travel" label="Recommendation"
    fields={[{ key: "title", placeholder: "Title", required: true }, { key: "address", placeholder: "Address" }, { key: "description", placeholder: "Notes" }]}
    render={(item: any) => (<div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-onyx/50">{[item.address, item.description].filter(Boolean).join(" · ")}</p></div>)} />;
}

// ============ THEME ============
function ThemeTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const theme: WeddingTheme = wedding.theme ?? {};
  const [accent, setAccent] = useState(theme.accent ?? "");
  const [bg, setBg] = useState(theme.bg ?? "");
  const [serif, setSerif] = useState(theme.serif ?? "");
  const [sans, setSans] = useState(theme.sans ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({
        theme: JSON.stringify({ accent: accent || null, bg: bg || null, serif: serif || null, sans: sans || null }),
      }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Theme saved"); },
    onError: (e) => toast.error(e.message),
  });
  const presets = [
    { name: "Sepia (default)", accent: "", bg: "" },
    { name: "Ivory & gold", accent: "#8a6b2a", bg: "#f6efdd" },
    { name: "Deep rose", accent: "#7a2b3a", bg: "#f5ecec" },
    { name: "Midnight & pearl", accent: "#e6dfd0", bg: "#12141a" },
    { name: "Sage garden", accent: "#3f5d3a", bg: "#ecefe4" },
  ];
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-3xl bg-card border border-onyx/10 p-8 space-y-6">
      <div>
        <p className="eyebrow mb-3">Palette presets</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button type="button" key={p.name} onClick={() => { setAccent(p.accent); setBg(p.bg); }}
              className="text-xs px-3 py-2 border border-onyx/20 hover:border-onyx flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-onyx/30" style={{ background: p.bg || "var(--parchment)" }} />
              <span className="w-4 h-4 rounded-full border border-onyx/30" style={{ background: p.accent || "var(--sepia)" }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Accent color (hex)" value={accent} onChange={setAccent} placeholder="#5c3d1f" />
        <Field label="Background color (hex)" value={bg} onChange={setBg} placeholder="#efe4cd" />
        <Field label="Serif font family" value={serif} onChange={setSerif} placeholder="'Cormorant Garamond', serif" />
        <Field label="Sans font family" value={sans} onChange={setSans} placeholder="'Outfit', sans-serif" />
      </div>
      <div className="p-6 border" style={{ background: bg || undefined, color: accent || undefined }}>
        <p className="text-xs tracking-widest mb-2" style={{ fontFamily: sans || undefined }}>PREVIEW</p>
        <p className="text-3xl italic" style={{ fontFamily: serif || undefined }}>
          {wedding.couple_name_one} &amp; {wedding.couple_name_two}
        </p>
      </div>
      <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Save theme</button>
    </form>
  );
}
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
    </div>
  );
}

// ============ SITE (share + hero) ============
function SiteTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [story, setStory] = useState(wedding.story ?? "");
  const [heroUrl, setHeroUrl] = useState(wedding.hero_image_url ?? "");
  const [published, setPublished] = useState(wedding.is_published);
  const [hashtag, setHashtag] = useState(wedding.hashtag ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({
        story, hero_image_url: heroUrl || null, is_published: published, hashtag: hashtag || null,
      }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Site updated"); },
    onError: (e) => toast.error(e.message),
  });
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const shareUrl = `${origin}/w/${wedding.slug}`;
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-card border border-onyx/10 p-8">
        <p className="eyebrow mb-4">Public site</p>
        <div className="flex gap-2 items-center mb-6">
          <code className="text-xs bg-mist px-3 py-2 flex-1 overflow-x-auto">{shareUrl}</code>
          <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied"); }} className="text-xs uppercase tracking-widest border border-onyx px-3 py-2 hover:bg-onyx hover:text-parchment">Copy</button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published (guests can visit the URL)
        </label>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="bg-card border border-onyx/10 p-8">
        <p className="eyebrow mb-4">Site content</p>
        <label className="eyebrow block mb-2">Hero image URL</label>
        <input value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="https://…" className="w-full border-b border-onyx/20 bg-transparent py-2 mb-4 outline-none focus:border-onyx" />
        <label className="eyebrow block mb-2">Hashtag</label>
        <input value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="#hazlynwed2026" className="w-full border-b border-onyx/20 bg-transparent py-2 mb-4 outline-none focus:border-onyx" />
        <label className="eyebrow block mb-2">Your story</label>
        <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={5} className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
        <button className="mt-6 bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
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
    mutationFn: async (id: string) => { await (supabase as any).from(table).delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey, wedding.id] }),
  });
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); const requiredOk = fields.filter((f) => f.required).every((f) => (values[f.key] ?? "").trim()); if (requiredOk) add.mutate(); }}
        className="bg-card border border-onyx/10 p-6 h-fit">
        <p className="eyebrow mb-4">New {label}</p>
        <div className="space-y-3">
          {fields.map((f) => (
            <input key={f.key} required={f.required} value={values[f.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          ))}
        </div>
        <button className="w-full mt-6 bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink">Add</button>
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
