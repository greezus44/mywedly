import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getWeddingBySlug, slugify, type Wedding, type WeddingTheme } from "@/lib/wedding-queries";
import { toast } from "sonner";
import { Eye, EyeOff, Search, Upload, Trash2, Pencil, Plus } from "lucide-react";
import { CollapsibleStyle } from "@/components/dashboard/TextStyleEditor";
import type { TextStyle } from "@/lib/text-styles";
import { autoMap, FIELD_LABELS, parseFile, parsePastedTable, type GuestField, type ParsedRow } from "@/lib/guest-import";

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

// ============ Navigation model ============
type SubKey =
  | "overview"
  | "web-cover" | "web-invitation" | "web-info" | "web-pages"
  | "ev-list" | "ev-manage" | "ev-rsvp"
  | "gu-list" | "gu-groups" | "gu-invites"
  | "ap-themes" | "ap-colors"
  | "st-language" | "st-login" | "st-general";

type Group = { key: string; label: string; children: { key: SubKey; label: string }[] };

const GROUPS: Group[] = [
  { key: "overview", label: "Overview", children: [{ key: "overview", label: "Overview" }] },
  { key: "website", label: "Website", children: [
    { key: "web-cover", label: "Cover" },
    { key: "web-invitation", label: "Invitation" },
    { key: "web-info", label: "Information" },
    { key: "web-pages", label: "Custom Pages" },
  ]},
  { key: "events", label: "Events", children: [
    { key: "ev-list", label: "Event List" },
    { key: "ev-manage", label: "Manage Events" },
    { key: "ev-rsvp", label: "RSVP Responses" },
  ]},
  { key: "guests", label: "Guests", children: [
    { key: "gu-list", label: "Guest List" },
    { key: "gu-groups", label: "Guest Groups" },
    { key: "gu-invites", label: "Invitations" },
  ]},
  { key: "appearance", label: "Appearance", children: [
    { key: "ap-themes", label: "Themes" },
    { key: "ap-colors", label: "Colours & Fonts" },
  ]},
  { key: "settings", label: "Settings", children: [
    { key: "st-language", label: "Language" },
    { key: "st-login", label: "Guest Login" },
    { key: "st-general", label: "General" },
  ]},
];

function ManagePage() {
  const { wedding } = Route.useLoaderData();
  const [group, setGroup] = useState<string>("overview");
  const [sub, setSub] = useState<SubKey>("overview");

  const currentGroup = GROUPS.find((g) => g.key === group) ?? GROUPS[0];

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

      <header className="max-w-6xl mx-auto px-6 md:px-10 pt-12 pb-6">
        <p className="eyebrow mb-3 text-sepia">The Wedding</p>
        <h1 className="font-serif text-4xl md:text-5xl italic leading-none">
          {wedding.couple_name_one} &amp; {wedding.couple_name_two}
        </h1>
        <p className="text-onyx/60 mt-3 text-sm">
          {wedding.wedding_date
            ? new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
            : "Date not set"}
          {wedding.location ? ` — ${wedding.location}` : ""}
        </p>
      </header>

      {/* Primary tabs */}
      <div className="border-y border-onyx/10 bg-mist/30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 flex gap-6 overflow-x-auto">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => { setGroup(g.key); setSub(g.children[0].key); }}
              className={`py-4 text-xs uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                group === g.key ? "border-onyx text-onyx" : "border-transparent text-onyx/50 hover:text-onyx"
              }`}
            >{g.label}</button>
          ))}
        </div>
      </div>

      {/* Sub tabs */}
      {currentGroup.children.length > 1 && (
        <div className="border-b border-onyx/10">
          <div className="max-w-6xl mx-auto px-6 md:px-10 flex gap-4 overflow-x-auto py-3">
            {currentGroup.children.map((c) => (
              <button
                key={c.key}
                onClick={() => setSub(c.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  sub === c.key ? "bg-onyx text-parchment border-onyx" : "border-onyx/15 text-onyx/60 hover:text-onyx"
                }`}
              >{c.label}</button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        {sub === "overview" && <OverviewTab wedding={wedding} />}
        {sub === "web-cover" && <CoverEditor wedding={wedding} />}
        {sub === "web-invitation" && <InvitationEditor wedding={wedding} />}
        {sub === "web-info" && <InfoEditor wedding={wedding} />}
        {sub === "web-pages" && <PagesTab wedding={wedding} />}
        {sub === "ev-list" && <EventsList wedding={wedding} />}
        {sub === "ev-manage" && <EventsManage wedding={wedding} />}
        {sub === "ev-rsvp" && <RsvpsTab wedding={wedding} />}
        {sub === "gu-list" && <GuestsTab wedding={wedding} />}
        {sub === "gu-groups" && <GroupsTab wedding={wedding} />}
        {sub === "gu-invites" && <InvitesTab wedding={wedding} />}
        {sub === "ap-themes" && <ThemesTab wedding={wedding} />}
        {sub === "ap-colors" && <ThemeTab wedding={wedding} />}
        {sub === "st-language" && <LanguageTab wedding={wedding} />}
        {sub === "st-login" && <SigninEditor wedding={wedding} />}
        {sub === "st-general" && <SiteTab wedding={wedding} />}
      </main>
    </div>
  );
}

// ============ Overview ============
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

function StatCard({ big, label, span }: { big: React.ReactNode; label: string; span?: number }) {
  return (
    <div className={`bg-card border border-onyx/10 p-6 ${span === 2 ? "md:col-span-2" : ""}`}>
      <p className="eyebrow mb-4">{label}</p>
      <p className="font-serif text-5xl italic">{big}</p>
    </div>
  );
}

// ============ Content editor primitive ============
function useContentSave(wedding: Wedding) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const current = (wedding.content ?? {}) as Record<string, any>;
      const merged = { ...current, ...patch };
      // deep-merge styles
      if (patch.styles) merged.styles = { ...(current.styles ?? {}), ...patch.styles };
      const { error } = await supabase.from("weddings").update({ content: merged }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); qc.invalidateQueries(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

type Field = { key: string; label: string; type?: "text" | "textarea" | "image" | "url"; placeholder?: string; rows?: number };

function FieldsEditor({
  wedding, title, description, fields,
}: {
  wedding: Wedding; title: string; description?: string; fields: Field[];
}) {
  const content = (wedding.content ?? {}) as Record<string, any>;
  const styles = (content.styles ?? {}) as Record<string, TextStyle | undefined>;
  const initial: Record<string, string> = {};
  fields.forEach((f) => (initial[f.key] = content[f.key] ?? ""));
  const [vals, setVals] = useState(initial);
  const [styleVals, setStyleVals] = useState<Record<string, TextStyle | undefined>>({});
  useEffect(() => {
    const s: Record<string, TextStyle | undefined> = {};
    fields.forEach((f) => { s[f.key] = styles[f.key]; });
    setStyleVals(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedding.id]);

  const save = useContentSave(wedding);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const patch: Record<string, any> = {};
        for (const f of fields) patch[f.key] = vals[f.key] || null;
        patch.styles = styleVals;
        save.mutate(patch);
      }}
      className="max-w-3xl bg-card border border-onyx/10 p-8 space-y-8"
    >
      <div>
        <p className="eyebrow">{title}</p>
        {description && <p className="text-xs text-onyx/50 mt-2">{description}</p>}
      </div>
      {fields.map((f) => (
        <div key={f.key} className="space-y-3">
          <label className="eyebrow block">{f.label}</label>
          {f.type === "textarea" ? (
            <textarea
              value={vals[f.key]} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder} rows={f.rows ?? 6}
              className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx"
            />
          ) : (
            <input
              value={vals[f.key]} onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx"
            />
          )}
          {f.type !== "image" && f.type !== "url" && (
            <CollapsibleStyle
              label={f.label}
              value={styleVals[f.key]}
              onChange={(s) => setStyleVals((v) => ({ ...v, [f.key]: s }))}
              preview={vals[f.key] || f.placeholder || f.label}
            />
          )}
        </div>
      ))}
      <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

// ============ Website editors ============
function CoverEditor({ wedding }: { wedding: Wedding }) {
  return <FieldsEditor wedding={wedding} title="Cover page" description="What guests see first — the landing page of your invitation."
    fields={[
      { key: "cover_background_url", label: "Background image URL", type: "url", placeholder: "https://…" },
      { key: "cover_logo_url", label: "Your logo (optional URL)", type: "url", placeholder: "https://… (leave blank to use monogram)" },
      { key: "cover_heading", label: "Main heading", placeholder: `${wedding.couple_name_one} & ${wedding.couple_name_two}` },
      { key: "cover_subtitle", label: "Subtitle (date/month/year override)", placeholder: "December 2026" },
      { key: "cover_welcome", label: "Welcome text", type: "textarea", rows: 3, placeholder: "A short welcome message." },
      { key: "cover_cta_label", label: "Enter button text", placeholder: "OPEN INVITATION" },
      { key: "cover_music_url", label: "Background music URL (optional)", type: "url", placeholder: "https://…mp3" },
    ]} />;
}
function InvitationEditor({ wedding }: { wedding: Wedding }) {
  return <FieldsEditor wedding={wedding} title="Invitation page" fields={[
    { key: "invitation_bismillah", label: "Top ornament / Bismillah", placeholder: "بِسْمِ اللَّهِ …" },
    { key: "invitation_heading", label: "Heading", placeholder: "Sample heading" },
    { key: "parents", label: "Parents block", type: "textarea", rows: 4 },
    { key: "invitation_text", label: "Invitation text", type: "textarea", rows: 4 },
    { key: "closing_text", label: "Closing text", type: "textarea", rows: 3 },
    { key: "invitation_cta_label", label: "Button label", placeholder: "RSVP" },
  ]} />;
}
function InfoEditor({ wedding }: { wedding: Wedding }) {
  return <FieldsEditor wedding={wedding} title="Information page" fields={[
    { key: "info_heading", label: "Heading", placeholder: "INFORMATION" },
    { key: "info_image_url", label: "Image URL (optional)", type: "url", placeholder: "https://…" },
    { key: "info_body", label: "Body text", type: "textarea", rows: 10 },
  ]} />;
}
function SigninEditor({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [helper, setHelper] = useState(wedding.signin_helper ?? "");
  const saveAccess = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({
        signin_helper: helper || null,
      }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Login settings saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => { e.preventDefault(); saveAccess.mutate(); }} className="max-w-2xl bg-card border border-onyx/10 p-8 space-y-6">
        <p className="eyebrow">Guest sign-in</p>
        <p className="text-sm text-onyx/60">
          Guests sign in with their name only. Names must be unique per wedding — add each guest under the <strong>Guests</strong> tab so they can be recognised on sign-in.
        </p>
        <div>
          <label className="eyebrow block mb-2">Helper text on sign-in page</label>
          <textarea value={helper} onChange={(e) => setHelper(e.target.value)} rows={3}
            placeholder="Please enter the name as printed on your invitation."
            className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
        </div>
        <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
      </form>

      <FieldsEditor wedding={wedding} title="Sign-in page copy" description="Customize the wording guests see on the sign-in screen."
        fields={[
          { key: "signin_heading", label: "Heading", placeholder: "SIGN IN" },
          { key: "signin_name_placeholder", label: "Name field placeholder", placeholder: "ENTER YOUR NAME" },
          { key: "signin_helper", label: "Description / helper", type: "textarea", rows: 2, placeholder: "As stated on your invitation" },
        ]} />
    </div>
  );
}

// ============ Custom pages ============
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
        wedding_id: wedding.id, title: title.trim(), slug: finalSlug, body,
        cover_image_url: cover || null, inline_image_url: inline || null, is_published: true,
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
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("custom_pages").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages", wedding.id] }),
  });
  const load = (p: any) => { setEditing(p.id); setTitle(p.title); setSlug(p.slug); setBody(p.body ?? ""); setCover(p.cover_image_url ?? ""); setInline(p.inline_image_url ?? ""); };
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
            <div><p className="font-medium">{p.title}</p><p className="text-xs text-onyx/50">/w/{wedding.slug}/p/{p.slug}</p></div>
            <div className="flex gap-3">
              <button onClick={() => load(p)} className="text-xs text-onyx/60 hover:text-onyx"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del.mutate(p.id)} className="text-xs text-onyx/40 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ Events ============
function EventsList({ wedding }: { wedding: Wedding }) {
  const { data: events } = useQuery({
    queryKey: ["events", wedding.id],
    queryFn: async () => (await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at")).data ?? [],
  });
  return (
    <div className="bg-card border border-onyx/10">
      <div className="p-6 border-b border-onyx/10 flex justify-between items-center">
        <p className="eyebrow">Events</p>
        <span className="text-xs text-onyx/50">{events?.length ?? 0}</span>
      </div>
      <ul className="divide-y divide-onyx/5">
        {events?.length === 0 && <li className="p-6 text-sm text-onyx/50">No events yet — add one in "Manage Events".</li>}
        {events?.map((e: any) => (
          <li key={e.id} className="p-6">
            <p className="serif-italic text-2xl">{e.name}</p>
            <p className="text-xs text-onyx/60 mt-1">
              {e.starts_at ? new Date(e.starts_at).toLocaleString() : "Time TBD"}
              {e.venue_name ? ` — ${e.venue_name}` : ""}
              {e.venue_address ? ` · ${e.venue_address}` : ""}
            </p>
            {e.dress_code && <p className="text-xs text-onyx/50 mt-1">Attire: {e.dress_code}</p>}
            {e.notes && <p className="text-xs text-onyx/50 mt-1 whitespace-pre-line">{e.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventsManage({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const emptyEv = { name: "", date: "", time: "", venue_name: "", venue_address: "", dress_code: "", notes: "" };
  const [form, setForm] = useState(emptyEv);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: events } = useQuery({
    queryKey: ["events", wedding.id],
    queryFn: async () => (await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("starts_at")).data ?? [],
  });

  const compose = () => {
    const iso = form.date ? new Date(`${form.date}T${form.time || "00:00"}`).toISOString() : null;
    return {
      name: form.name.trim(), starts_at: iso,
      venue_name: form.venue_name.trim() || null, venue_address: form.venue_address.trim() || null,
      dress_code: form.dress_code.trim() || null, notes: form.notes.trim() || null,
    };
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = compose();
      if (editing) {
        const { error } = await supabase.from("events").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert({ ...payload, wedding_id: wedding.id, kind: "other", visibility: "public" });
        if (error) throw error;
      }
    },
    onSuccess: () => { setForm(emptyEv); setEditing(null); qc.invalidateQueries({ queryKey: ["events", wedding.id] }); toast.success("Event saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("events").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events", wedding.id] }),
  });
  const load = (e: any) => {
    setEditing(e.id);
    const d = e.starts_at ? new Date(e.starts_at) : null;
    const iso = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
    setForm({
      name: e.name ?? "", date: iso ? iso.slice(0, 10) : "", time: iso ? iso.slice(11, 16) : "",
      venue_name: e.venue_name ?? "", venue_address: e.venue_address ?? "",
      dress_code: e.dress_code ?? "", notes: e.notes ?? "",
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <form onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) save.mutate(); }} className="bg-card border border-onyx/10 p-6 h-fit space-y-3">
        <p className="eyebrow">{editing ? "Edit event" : "Add event"}</p>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Event name" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        </div>
        <input value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} placeholder="Venue" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} placeholder="Address" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} placeholder="Dress code (optional)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Programme / schedule / notes" className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
        <div className="flex gap-2">
          <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">{editing ? "Update" : "Add"}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyEv); }} className="text-xs uppercase tracking-widest px-4">Cancel</button>}
        </div>
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
            <div className="flex gap-3">
              <button onClick={() => load(e)} className="text-xs text-onyx/60 hover:text-onyx"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del.mutate(e.id)} className="text-xs text-onyx/40 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ RSVPs ============
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

// ============ Guests ============
function GuestsTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [showImport, setShowImport] = useState(false);

  const emptyForm = { full_name: "", group_id: "" };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: guests } = useQuery({
    queryKey: ["guests", wedding.id],
    queryFn: async () => (await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("full_name")).data ?? [],
  });
  const { data: groups } = useQuery({
    queryKey: ["groups", wedding.id],
    queryFn: async () => (await supabase.from("guest_groups").select("*").eq("wedding_id", wedding.id).order("sort_order")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        wedding_id: wedding.id,
        full_name: form.full_name.trim(),
        group_id: form.group_id || null,
      };
      if (!payload.full_name) throw new Error("Name required");
      if (editing) {
        const { error } = await supabase.from("guests").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guests").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { setForm(emptyForm); setEditing(null); qc.invalidateQueries({ queryKey: ["guests", wedding.id] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (guests ?? []).filter((g: any) => {
      if (filterGroup && g.group_id !== filterGroup) return false;
      if (!q) return true;
      return g.full_name.toLowerCase().includes(q);
    });
  }, [guests, search, filterGroup]);

  const load = (g: any) => { setEditing(g.id); setForm({ full_name: g.full_name ?? "", group_id: g.group_id ?? "" }); };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-8">
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="bg-card border border-onyx/10 p-6 h-fit space-y-3">
          <div className="flex justify-between items-center">
            <p className="eyebrow">{editing ? "Edit guest" : "Add guest"}</p>
            <button type="button" onClick={() => setShowImport(true)} className="text-xs flex items-center gap-1 text-onyx/60 hover:text-onyx"><Upload className="w-3 h-3" />Import</button>
          </div>
          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name (unique per wedding)" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <select value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx">
            <option value="">No group</option>
            {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink flex items-center gap-1"><Plus className="w-3 h-3" />{editing ? "Update" : "Add"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); }} className="text-xs uppercase tracking-widest px-4">Cancel</button>}
          </div>
        </form>
        <div className="lg:col-span-2 bg-card border border-onyx/10">
          <div className="flex items-center gap-3 p-4 border-b border-onyx/10 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-onyx/40" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guests…" className="w-full border border-onyx/15 bg-transparent pl-8 pr-3 py-2 text-sm outline-none focus:border-onyx" />
            </div>
            <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="border border-onyx/15 bg-transparent px-2 py-2 text-sm">
              <option value="">All groups</option>
              {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <span className="text-xs text-onyx/50">{filtered.length} shown</span>
          </div>
          <ul>
            {filtered.length === 0 && <li className="p-6 text-onyx/50 text-sm">No guests match.</li>}
            {filtered.map((g: any) => (
              <li key={g.id} className="p-3 px-6 border-b border-onyx/5 last:border-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{g.full_name}</p>
                    <p className="text-xs text-onyx/50">
                      {(groups ?? []).find((gr: any) => gr.id === g.group_id)?.name || "—"}
                    </p>
                  </div>
                  <select value={g.group_id ?? ""} onChange={(e) => updateGuest.mutate({ id: g.id, patch: { group_id: e.target.value || null } })} className="text-xs border border-onyx/20 bg-transparent px-2 py-1">
                    <option value="">No group</option>
                    {(groups ?? []).map((gr: any) => <option key={gr.id} value={gr.id}>{gr.name}</option>)}
                  </select>
                  <button onClick={() => load(g)} className="text-onyx/60 hover:text-onyx" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm(`Remove ${g.full_name}?`)) del.mutate(g.id); }} className="text-onyx/40 hover:text-destructive" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {showImport && <BulkImportModal wedding={wedding} groups={groups ?? []} onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); qc.invalidateQueries({ queryKey: ["guests", wedding.id] }); }} />}
    </div>
  );
}

// ============ Bulk import (CSV / XLSX / paste) ============
function BulkImportModal({ wedding, groups, onClose, onDone }: { wedding: Wedding; groups: any[]; onClose: () => void; onDone: () => void }) {
  const [step, setStep] = useState<"input" | "map">("input");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, GuestField>>({});
  const [defaultGroup, setDefaultGroup] = useState<string>("");
  const [duplicates, setDuplicates] = useState<"skip" | "update">("skip");
  const [paste, setPaste] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    try {
      const { headers, rows } = await parseFile(file);
      if (!headers.length) return toast.error("Could not read file");
      setHeaders(headers); setRows(rows); setMapping(autoMap(headers)); setStep("map");
    } catch (e) { toast.error((e as Error).message); }
  };
  const onPaste = () => {
    const { headers, rows } = parsePastedTable(paste);
    if (!headers.length) return toast.error("Nothing to import");
    setHeaders(headers); setRows(rows); setMapping(autoMap(headers)); setStep("map");
  };

  const run = useMutation({
    mutationFn: async () => {
      const nameCol = Object.entries(mapping).find(([, v]) => v === "full_name")?.[0];
      if (!nameCol) throw new Error("Map a column to Guest name");
      const codeCol = Object.entries(mapping).find(([, v]) => v === "access_code")?.[0];
      const groupCol = Object.entries(mapping).find(([, v]) => v === "group_name")?.[0];

      // ensure groups exist
      const groupIdByName = new Map<string, string>();
      (groups ?? []).forEach((g) => groupIdByName.set(g.name.toLowerCase(), g.id));
      const newGroupNames = new Set<string>();
      if (groupCol) rows.forEach((r) => { const n = r[groupCol]?.trim(); if (n && !groupIdByName.has(n.toLowerCase())) newGroupNames.add(n); });
      if (newGroupNames.size) {
        const toInsert = Array.from(newGroupNames).map((name) => ({ wedding_id: wedding.id, name }));
        const { data } = await supabase.from("guest_groups").insert(toInsert).select();
        (data ?? []).forEach((g: any) => groupIdByName.set(g.name.toLowerCase(), g.id));
      }

      const { data: existing } = await supabase.from("guests").select("id, full_name").eq("wedding_id", wedding.id);
      const existingByName = new Map<string, string>();
      (existing ?? []).forEach((g: any) => existingByName.set(g.full_name.toLowerCase().trim(), g.id));

      const inserts: any[] = [];
      const updates: { id: string; patch: any }[] = [];
      for (const r of rows) {
        const name = (r[nameCol] ?? "").trim();
        if (!name) continue;
        const code = codeCol ? (r[codeCol] ?? "").trim() || null : null;
        const gname = groupCol ? (r[groupCol] ?? "").trim() : "";
        const groupId = gname ? groupIdByName.get(gname.toLowerCase()) ?? null : (defaultGroup || null);
        const existingId = existingByName.get(name.toLowerCase());
        if (existingId) {
          if (duplicates === "update") updates.push({ id: existingId, patch: { access_code: code, group_id: groupId } });
        } else {
          inserts.push({ wedding_id: wedding.id, full_name: name, access_code: code, group_id: groupId });
        }
      }
      if (inserts.length) {
        const { error } = await supabase.from("guests").insert(inserts);
        if (error) throw error;
      }
      for (const u of updates) {
        await supabase.from("guests").update(u.patch).eq("id", u.id);
      }
      return { inserted: inserts.length, updated: updates.length, skipped: rows.length - inserts.length - updates.length };
    },
    onSuccess: (r) => { toast.success(`${r.inserted} added, ${r.updated} updated, ${r.skipped} skipped`); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 bg-onyx/40 flex items-center justify-center p-4">
      <div className="bg-parchment max-w-3xl w-full max-h-[90vh] overflow-auto p-8 shadow-editorial">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="eyebrow">Bulk import guests</p>
            <h2 className="font-serif text-3xl italic">Add many guests at once</h2>
          </div>
          <button onClick={onClose} className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx">Close</button>
        </div>

        {step === "input" && (
          <div className="space-y-6">
            <div className="border border-dashed border-onyx/20 p-8 text-center">
              <p className="mb-3 text-sm">Upload a CSV or Excel file</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.tsv" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Choose file</button>
              <p className="text-xs text-onyx/50 mt-3">Supported: .csv, .xlsx, .xls, .tsv</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Or paste from Google Sheets / Excel</p>
              <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={6}
                placeholder="Guest Name, Password, Group&#10;Ada Lovelace, 1234, Family" className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx font-mono text-xs" />
              <button onClick={onPaste} disabled={!paste.trim()} className="mt-3 bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink disabled:opacity-40">Continue</button>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-6">
            <div>
              <p className="eyebrow mb-3">Match your columns</p>
              <div className="space-y-2">
                {headers.map((h) => (
                  <div key={h} className="flex items-center gap-3">
                    <div className="w-1/2 text-sm">{h} <span className="text-xs text-onyx/40">({rows[0]?.[h] ?? ""})</span></div>
                    <select value={mapping[h] ?? ""} onChange={(e) => setMapping({ ...mapping, [h]: (e.target.value || null) as GuestField })} className="border border-onyx/20 bg-transparent px-2 py-1 text-sm">
                      <option value="">— skip —</option>
                      {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((k) => (
                        <option key={k} value={k}>{FIELD_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="eyebrow mb-2">Default group</p>
                <select value={defaultGroup} onChange={(e) => setDefaultGroup(e.target.value)} className="w-full border border-onyx/20 bg-transparent px-2 py-2 text-sm">
                  <option value="">No group</option>
                  {(groups ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <p className="eyebrow mb-2">Duplicates (same name)</p>
                <select value={duplicates} onChange={(e) => setDuplicates(e.target.value as any)} className="w-full border border-onyx/20 bg-transparent px-2 py-2 text-sm">
                  <option value="skip">Skip</option>
                  <option value="update">Update existing</option>
                </select>
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Preview ({rows.length} rows)</p>
              <div className="border border-onyx/10 max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-mist/40"><tr>{headers.map((h) => <th key={h} className="text-left p-2">{h}</th>)}</tr></thead>
                  <tbody>{rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t border-onyx/5">{headers.map((h) => <td key={h} className="p-2">{r[h]}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep("input")} className="text-xs uppercase tracking-widest text-onyx/60 hover:text-onyx">Back</button>
              <button onClick={() => run.mutate()} disabled={run.isPending} className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink disabled:opacity-50">
                {run.isPending ? "Importing…" : `Import ${rows.length} guests`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Guest groups ============
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
    queryFn: async () => (await supabase.from("group_event_invites").select("group_id, event_id")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => { await supabase.from("guest_groups").insert({ wedding_id: wedding.id, name: name.trim() }); },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["groups", wedding.id] }); toast.success("Group added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("guest_groups").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups", wedding.id] }),
  });
  const toggle = useMutation({
    mutationFn: async ({ groupId, eventId, on }: { groupId: string; eventId: string; on: boolean }) => {
      if (on) await supabase.from("group_event_invites").insert({ group_id: groupId, event_id: eventId });
      else await supabase.from("group_event_invites").delete().eq("group_id", groupId).eq("event_id", eventId);
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
            {(events ?? []).length === 0 && <p className="text-sm text-onyx/50">No events yet.</p>}
            {(events ?? []).map((ev: any) => {
              const on = !!(groupInvites as any[])?.find((gi) => gi.group_id === g.id && gi.event_id === ev.id);
              return (
                <button key={ev.id} onClick={() => toggle.mutate({ groupId: g.id, eventId: ev.id, on: !on })}
                  className={`text-xs px-3 py-2 border ${on ? "bg-onyx text-parchment border-onyx" : "border-onyx/20 hover:border-onyx"}`}>
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

// ============ Invites (per-guest event assignment) ============
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
    queryFn: async () => (await supabase.from("guest_event_invites").select("guest_id, event_id")).data ?? [],
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
  if (!guests?.length || !events?.length) return <p className="text-sm text-onyx/50">Add guests and events first.</p>;
  return (
    <div className="bg-card border border-onyx/10 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-mist/40 text-onyx/60 text-[10px] uppercase tracking-widest">
          <tr><th className="text-left p-3">Guest</th>{events.map((e: any) => <th key={e.id} className="p-3 text-center">{e.name}</th>)}</tr>
        </thead>
        <tbody>
          {guests.map((g: any) => (
            <tr key={g.id} className="border-t border-onyx/5">
              <td className="p-3"><p className="font-medium">{g.full_name}</p></td>
              {events.map((e: any) => {
                const direct = !!(invites as any[])?.find((i) => i.guest_id === g.id && i.event_id === e.id);
                const viaGroup = !!g.group_id && !!(groupInvites as any[])?.find((gi) => gi.group_id === g.group_id && gi.event_id === e.id);
                const on = direct || viaGroup;
                return (
                  <td key={e.id} className="p-3 text-center">
                    <button
                      onClick={() => toggle.mutate({ guestId: g.id, eventId: e.id, on: !direct })}
                      title={viaGroup && !direct ? "Invited via group" : ""}
                      className={`w-8 h-8 rounded border-2 ${on ? (viaGroup && !direct ? "bg-onyx/40 border-onyx/40 text-parchment" : "bg-onyx border-onyx text-parchment") : "border-onyx/20 hover:border-onyx"}`}>
                      {on ? "✓" : ""}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="p-4 text-xs text-onyx/50">Filled = invited. Faded = inherited from group.</p>
    </div>
  );
}

// ============ Appearance: Themes + Colours & Fonts ============
const THEME_PRESETS: Array<{ name: string; accent: string; bg: string; serif?: string; sans?: string }> = [
  { name: "Sepia (default)", accent: "#8c7e6a", bg: "#fdfcf9" },
  { name: "Ivory & gold", accent: "#8a6b2a", bg: "#f6efdd" },
  { name: "Deep rose", accent: "#7a2b3a", bg: "#f5ecec" },
  { name: "Midnight & pearl", accent: "#e6dfd0", bg: "#12141a" },
  { name: "Sage garden", accent: "#3f5d3a", bg: "#ecefe4" },
  { name: "Blush petal", accent: "#a0475a", bg: "#faeef0" },
  { name: "Ocean", accent: "#2e4a63", bg: "#eff4f8" },
  { name: "Terracotta", accent: "#a04a2a", bg: "#f6ece0" },
];

function ThemesTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const current = (wedding.theme ?? {}) as WeddingTheme;
  const apply = useMutation({
    mutationFn: async (t: WeddingTheme) => {
      const { error } = await supabase.from("weddings").update({ theme: t }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); qc.invalidateQueries(); toast.success("Theme applied"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {THEME_PRESETS.map((p) => {
        const active = current.accent === p.accent && current.bg === p.bg;
        return (
          <button key={p.name} onClick={() => apply.mutate({ accent: p.accent, bg: p.bg, serif: p.serif, sans: p.sans })}
            className={`bg-card border p-6 text-left transition-shadow hover:shadow-editorial ${active ? "border-onyx" : "border-onyx/10"}`}
            style={{ background: p.bg }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: p.accent }}>{p.name}</p>
            <p className="text-3xl italic" style={{ fontFamily: p.serif ?? "var(--font-serif)", color: p.accent }}>
              {wedding.couple_name_one} &amp; {wedding.couple_name_two}
            </p>
            <div className="flex gap-1 mt-4">
              <span className="w-6 h-6 border border-onyx/20" style={{ background: p.bg }} />
              <span className="w-6 h-6" style={{ background: p.accent }} />
            </div>
            {active && <p className="text-xs mt-3 uppercase tracking-widest" style={{ color: p.accent }}>Active</p>}
          </button>
        );
      })}
    </div>
  );
}

function ThemeTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const theme: WeddingTheme = (wedding.theme ?? {}) as WeddingTheme;
  const [accent, setAccent] = useState(theme.accent ?? "");
  const [bg, setBg] = useState(theme.bg ?? "");
  const [serif, setSerif] = useState(theme.serif ?? "");
  const [sans, setSans] = useState(theme.sans ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({
        theme: { accent: accent || null, bg: bg || null, serif: serif || null, sans: sans || null } as any,
      }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); qc.invalidateQueries(); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-3xl bg-card border border-onyx/10 p-8 space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Accent color" value={accent} onChange={setAccent} placeholder="#8c7e6a" type="color" />
        <Field label="Background color" value={bg} onChange={setBg} placeholder="#fdfcf9" type="color" />
        <Field label="Serif font family" value={serif} onChange={setSerif} placeholder="'Cormorant Garamond', serif" />
        <Field label="Sans font family" value={sans} onChange={setSans} placeholder="'Outfit', sans-serif" />
      </div>
      <div className="p-6 border" style={{ background: bg || undefined, color: accent || undefined }}>
        <p className="text-xs tracking-widest mb-2" style={{ fontFamily: sans || undefined }}>PREVIEW</p>
        <p className="text-3xl italic" style={{ fontFamily: serif || undefined }}>
          {wedding.couple_name_one} &amp; {wedding.couple_name_two}
        </p>
      </div>
      <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Save colours & fonts</button>
    </form>
  );
}
function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: "color" | "text" }) {
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <div className="flex gap-2 items-center">
        {type === "color" && (
          <input type="color" value={value || "#8c7e6a"} onChange={(e) => onChange(e.target.value)} className="w-10 h-9 border border-onyx/20 cursor-pointer" />
        )}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
      </div>
    </div>
  );
}

// ============ Settings ============
function LanguageTab({ wedding }: { wedding: Wedding }) {
  const content = (wedding.content ?? {}) as Record<string, any>;
  const qc = useQueryClient();
  const [langs, setLangs] = useState<string[]>(content.languages ?? ["en", "ms"]);
  const [defaultLang, setDefaultLang] = useState<string>(content.default_lang ?? "en");

  const save = useMutation({
    mutationFn: async () => {
      const merged = { ...content, languages: langs, default_lang: defaultLang };
      const { error } = await supabase.from("weddings").update({ content: merged }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const options = [{ v: "en", l: "English" }, { v: "ms", l: "Bahasa Melayu" }];

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="max-w-2xl bg-card border border-onyx/10 p-8 space-y-6">
      <div>
        <p className="eyebrow mb-3">Languages shown on your site</p>
        <div className="space-y-2">
          {options.map((o) => (
            <label key={o.v} className="flex items-center gap-3">
              <input type="checkbox" checked={langs.includes(o.v)} onChange={(e) => setLangs((ls) => e.target.checked ? Array.from(new Set([...ls, o.v])) : ls.filter((x) => x !== o.v))} />
              <span className="text-sm">{o.l}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="eyebrow mb-2">Default language</p>
        <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)} className="border border-onyx/15 bg-transparent px-3 py-2 text-sm">
          {options.filter((o) => langs.includes(o.v)).map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
      <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
    </form>
  );
}

function SiteTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [story, setStory] = useState(wedding.story ?? "");
  const [heroUrl, setHeroUrl] = useState(wedding.hero_image_url ?? "");
  const [published, setPublished] = useState(wedding.is_published);
  const [hashtag, setHashtag] = useState(wedding.hashtag ?? "");
  const [nameOne, setNameOne] = useState(wedding.couple_name_one);
  const [nameTwo, setNameTwo] = useState(wedding.couple_name_two);
  const [date, setDate] = useState(wedding.wedding_date ?? "");
  const [location, setLocation] = useState(wedding.location ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({
        story, hero_image_url: heroUrl || null, is_published: published, hashtag: hashtag || null,
        couple_name_one: nameOne, couple_name_two: nameTwo,
        wedding_date: date || null, location: location || null,
      }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weddings"] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
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
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="bg-card border border-onyx/10 p-8 space-y-4">
        <p className="eyebrow">General details</p>
        <div className="grid grid-cols-2 gap-3">
          <input value={nameOne} onChange={(e) => setNameOne(e.target.value)} placeholder="Partner one" className="border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input value={nameTwo} onChange={(e) => setNameTwo(e.target.value)} placeholder="Partner two" className="border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} placeholder="Hero image URL" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="#hashtag" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={5} placeholder="Your story" className="w-full border border-onyx/20 bg-transparent p-3 outline-none focus:border-onyx" />
        <button className="bg-onyx text-parchment px-6 py-3 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
      </form>
    </div>
  );
}
