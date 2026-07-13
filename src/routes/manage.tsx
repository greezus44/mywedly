import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type WeddingContent, type GuestEvent, type Guest, type GuestGroup, type CustomPage, type Rsvp } from "@/lib/supabase";
import { useWedding } from "@/lib/use-wedding";
import { styleFor, getStyle, FONT_OPTIONS, THEME_PRESETS } from "@/lib/text-styles";
import { formatEventDate, formatEventTime } from "@/lib/wedding-guest";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { TimePicker12 } from "@/components/dashboard/TimePicker12";
import { QrCodePanel } from "@/components/dashboard/QrCodePanel";
import { WebsitePreview } from "@/components/dashboard/WebsitePreview";
import { ChevronDown, ChevronRight } from "lucide-react";

type SubKey = "overview" | "web-cover" | "web-invitation" | "web-info" | "web-pages" | "ev-list" | "ev-rsvp" | "gu-list" | "gu-groups" | "gu-login" | "ap-appearance" | "st-general" | "st-public";

const TABS: { key: string; label: string; subs: { key: SubKey; label: string }[] }[] = [
  { key: "web", label: "Website", subs: [{ key: "web-cover", label: "Cover" }, { key: "web-invitation", label: "Invitation" }, { key: "web-info", label: "Info" }, { key: "web-pages", label: "Pages" }] },
  { key: "ev", label: "Events", subs: [{ key: "ev-list", label: "Event List" }, { key: "ev-rsvp", label: "RSVPs" }] },
  { key: "gu", label: "Guests", subs: [{ key: "gu-list", label: "Guest List" }, { key: "gu-groups", label: "Groups" }, { key: "gu-login", label: "Guest Login" }] },
  { key: "ap", label: "Appearance", subs: [{ key: "ap-appearance", label: "Design" }] },
  { key: "st", label: "Settings", subs: [{ key: "st-general", label: "General" }, { key: "st-public", label: "Share" }] },
];

export function ManagePage() {
  const slug = location.pathname.split("/")[2];
  const navigate = useNavigate();
  const { wedding, loading, error } = useWedding(slug);
  const [sub, setSub] = useState<SubKey>("overview");
  const [openTab, setOpenTab] = useState<string | null>("web");

  const previewMap: Partial<Record<SubKey, "cover" | "invitation" | "info" | "events">> = {
    "web-cover": "cover", "web-invitation": "invitation", "web-info": "info", "ev-list": "events", "ev-rsvp": "events", "ap-appearance": "cover",
  };
  const previewPage = previewMap[sub];
  const showPreview = !!previewPage;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (error || !wedding) return <div className="min-h-screen flex items-center justify-center text-red-600">{error ?? "Not found"}</div>;

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-onyx/10 bg-parchment px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => navigate("/dashboard")} className="text-sepia text-sm hover:text-onyx">← Dashboard</button>
        <h1 className="font-serif text-lg text-onyx">{wedding.couple_name_one} & {wedding.couple_name_two}</h1>
        <a href={`/w/${wedding.slug}`} target="_blank" className="text-sepia text-sm hover:text-onyx">View Site →</a>
      </header>
      <div className="flex">
        <nav className="w-56 border-r border-onyx/10 bg-parchment min-h-[calc(100vh-57px)] py-4 px-2 hidden md:block">
          <button onClick={() => setSub("overview")} className={`w-full text-left px-3 py-2 text-sm rounded ${sub === "overview" ? "bg-onyx/5 text-onyx font-medium" : "text-sepia"}`}>Overview</button>
          {TABS.map((tab) => (
            <div key={tab.key} className="mt-1">
              <button onClick={() => setOpenTab(openTab === tab.key ? null : tab.key)} className="w-full text-left px-3 py-2 text-sm text-onyx/70 font-medium flex items-center gap-1">
                {openTab === tab.key ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}{tab.label}
              </button>
              {openTab === tab.key && <div className="ml-3">{tab.subs.map((s) => <button key={s.key} onClick={() => setSub(s.key)} className={`w-full text-left px-3 py-1.5 text-sm rounded ${sub === s.key ? "bg-onyx/5 text-onyx" : "text-sepia/70"}`}>{s.label}</button>)}</div>}
            </div>
          ))}
        </nav>
        <main className="flex-1 p-6 md:p-10 max-w-6xl">
          <div className={showPreview ? "grid lg:grid-cols-[1fr_420px] gap-8" : ""}>
            <div className="min-w-0">
              {sub === "overview" && <OverviewTab wedding={wedding} />}
              {sub === "web-cover" && <CoverEditor wedding={wedding} />}
              {sub === "web-invitation" && <InvitationEditor wedding={wedding} />}
              {sub === "web-info" && <InfoEditor wedding={wedding} />}
              {sub === "web-pages" && <PagesTab wedding={wedding} />}
              {sub === "ev-list" && <EventsList wedding={wedding} />}
              {sub === "ev-rsvp" && <RsvpsTab wedding={wedding} />}
              {sub === "gu-list" && <GuestsTab wedding={wedding} />}
              {sub === "gu-groups" && <GroupsTab wedding={wedding} />}
              {sub === "gu-login" && <SigninEditor wedding={wedding} />}
              {sub === "ap-appearance" && <AppearanceTab wedding={wedding} />}
              {sub === "st-general" && <SiteTab wedding={wedding} />}
              {sub === "st-public" && <PublicWebsiteTab wedding={wedding} />}
            </div>
            {showPreview && <div className="hidden lg:block"><WebsitePreview slug={wedding.slug} page={previewPage} /></div>}
          </div>
        </main>
      </div>
    </div>
  );
}

function saveContent(weddingId: string, content: Record<string, unknown>, qc: ReturnType<typeof useQueryClient>) {
  supabase.from("weddings").update({ content }).eq("id", weddingId).then(({ error }) => { if (error) console.error(error.message); else qc.invalidateQueries({ queryKey: ["weddings"] }); });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs uppercase tracking-widest text-sepia">{label}</label><div className="mt-1">{children}</div></div>;
}

function OverviewTab({ wedding }: { wedding: Wedding }) {
  return (
    <div>
      <h2 className="text-2xl font-serif text-onyx mb-6">Overview</h2>
      <div className="grid gap-4">
        <div className="border border-onyx/10 bg-card p-6 rounded-md">
          <h3 className="text-sm uppercase tracking-widest text-sepia mb-2">Wedding</h3>
          <p className="text-lg font-serif">{wedding.couple_name_one} & {wedding.couple_name_two}</p>
          {wedding.wedding_date && <p className="text-sepia text-sm">{new Date(wedding.wedding_date).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>}
          {wedding.location && <p className="text-sepia text-sm">{wedding.location}</p>}
        </div>
        <div className="border border-onyx/10 bg-card p-6 rounded-md">
          <h3 className="text-sm uppercase tracking-widest text-sepia mb-2">Public URL</h3>
          <a href={`/w/${wedding.slug}`} target="_blank" className="text-onyx underline text-sm">{window.location.origin}/w/{wedding.slug}</a>
        </div>
      </div>
    </div>
  );
}

function CoverEditor({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const content = (wedding.content ?? {}) as WeddingContent;
  const [vals, setVals] = useState<Record<string, string>>({ cover_heading: (content.cover_heading as string) ?? "", cover_subtitle: (content.cover_subtitle as string) ?? "", cover_welcome: (content.cover_welcome as string) ?? "" });
  const save = () => { const m = { ...content, ...vals }; saveContent(wedding.id, m, qc); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Cover Page</h2>
      <div className="space-y-4">
        <Field label="Heading"><textarea value={vals.cover_heading} onChange={(e) => setVals({ ...vals, cover_heading: e.target.value })} rows={2} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <Field label="Subtitle"><textarea value={vals.cover_subtitle} onChange={(e) => setVals({ ...vals, cover_subtitle: e.target.value })} rows={2} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <Field label="Welcome Text"><textarea value={vals.cover_welcome} onChange={(e) => setVals({ ...vals, cover_welcome: e.target.value })} rows={3} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <div><label className="text-xs uppercase tracking-widest text-sepia">Background Image</label><ImageUpload weddingId={wedding.id} value={content.cover_background_url ?? null} onChange={(url) => { const m = { ...content, cover_background_url: url }; saveContent(wedding.id, m, qc); }} /></div>
        <div><label className="text-xs uppercase tracking-widest text-sepia">Logo (optional)</label><ImageUpload weddingId={wedding.id} value={content.cover_logo_url ?? null} onChange={(url) => { const m = { ...content, cover_logo_url: url }; saveContent(wedding.id, m, qc); }} /></div>
        <button onClick={save} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
      </div>
    </div>
  );
}

function InvitationEditor({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const content = (wedding.content ?? {}) as WeddingContent;
  const [vals, setVals] = useState<Record<string, string>>({ parents: (content.parents as string) ?? "", invitation_text: (content.invitation_text as string) ?? "", closing_text: (content.closing_text as string) ?? "" });
  const save = () => { const m = { ...content, ...vals }; saveContent(wedding.id, m, qc); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Invitation Page</h2>
      <div className="space-y-4">
        <Field label="Parents"><textarea value={vals.parents} onChange={(e) => setVals({ ...vals, parents: e.target.value })} rows={3} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <Field label="Invitation Text"><textarea value={vals.invitation_text} onChange={(e) => setVals({ ...vals, invitation_text: e.target.value })} rows={4} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <Field label="Closing Text"><textarea value={vals.closing_text} onChange={(e) => setVals({ ...vals, closing_text: e.target.value })} rows={3} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <button onClick={save} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
      </div>
    </div>
  );
}

function InfoEditor({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const content = (wedding.content ?? {}) as WeddingContent;
  const [vals, setVals] = useState<Record<string, string>>({ info_heading: (content.info_heading as string) ?? "", info_body: (content.info_body as string) ?? "" });
  const save = () => { const m = { ...content, ...vals }; saveContent(wedding.id, m, qc); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Info Page</h2>
      <div className="space-y-4">
        <Field label="Heading"><input value={vals.info_heading} onChange={(e) => setVals({ ...vals, info_heading: e.target.value })} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <Field label="Body Text"><textarea value={vals.info_body} onChange={(e) => setVals({ ...vals, info_body: e.target.value })} rows={8} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <div><label className="text-xs uppercase tracking-widest text-sepia">Image (optional)</label><ImageUpload weddingId={wedding.id} value={content.info_image_url ?? null} onChange={(url) => { const m = { ...content, info_image_url: url }; saveContent(wedding.id, m, qc); }} /></div>
        <button onClick={save} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
      </div>
    </div>
  );
}

function PagesTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [slug, setSlug] = useState(""); const [body, setBody] = useState(""); const [cover, setCover] = useState(""); const [inline, setInline] = useState("");
  const load = () => { supabase.from("custom_pages").select("*").eq("wedding_id", wedding.id).order("sort_order").then(({ data }) => setPages((data as CustomPage[]) ?? [])); };
  useEffect(load, [wedding.id]);
  const save = async () => {
    const payload = { wedding_id: wedding.id, slug, title, body, cover_image_url: cover || null, inline_image_url: inline || null, is_published: true };
    if (editing) await supabase.from("custom_pages").update(payload).eq("id", editing);
    else await supabase.from("custom_pages").insert(payload);
    setEditing(null); setTitle(""); setSlug(""); setBody(""); setCover(""); setInline(""); load(); qc.invalidateQueries({ queryKey: ["weddings"] });
  };
  const edit = (p: CustomPage) => { setEditing(p.id); setTitle(p.title); setSlug(p.slug); setBody(p.body ?? ""); setCover(p.cover_image_url ?? ""); setInline(p.inline_image_url ?? ""); };
  const del = async (id: string) => { await supabase.from("custom_pages").delete().eq("id", id); load(); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Custom Pages</h2>
      <div className="space-y-2 mb-8">
        {pages.map((p) => <div key={p.id} className="flex items-center justify-between border border-onyx/10 bg-card p-4 rounded-md"><div><span className="font-medium text-onyx">{p.title}</span> <span className="text-sepia text-sm">/{p.slug}</span></div><div className="flex gap-2"><button onClick={() => edit(p)} className="text-sepia text-sm hover:text-onyx">Edit</button><button onClick={() => del(p.id)} className="text-red-600 text-sm hover:opacity-70">Delete</button></div></div>)}
      </div>
      <div className="border border-onyx/10 bg-card p-6 rounded-md space-y-4">
        <h3 className="text-sm uppercase tracking-widest text-sepia">{editing ? "Edit Page" : "New Page"}</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body text" rows={6} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <ImageUpload weddingId={wedding.id} value={cover || null} onChange={(url) => setCover(url ?? "")} label="Cover image" />
        <ImageUpload weddingId={wedding.id} value={inline || null} onChange={(url) => setInline(url ?? "")} label="Inline image" />
        <div className="flex gap-2"><button onClick={save} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">{editing ? "Update" : "Create"}</button>{editing && <button onClick={() => { setEditing(null); setTitle(""); setSlug(""); setBody(""); setCover(""); setInline(""); }} className="text-sepia text-sm">Cancel</button>}</div>
      </div>
    </div>
  );
}

function EventsList({ wedding }: { wedding: Wedding }) {
  const [events, setEvents] = useState<GuestEvent[]>([]);
  const [name, setName] = useState(""); const [venue, setVenue] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("12:00");
  const load = () => { supabase.from("events").select("*").eq("wedding_id", wedding.id).order("sort_order").then(({ data }) => setEvents((data as GuestEvent[]) ?? [])); };
  useEffect(load, [wedding.id]);
  const add = async () => {
    if (!name) return;
    const startsAt = date ? new Date(`${date}T${time}:00`).toISOString() : new Date().toISOString();
    await supabase.from("events").insert({ wedding_id: wedding.id, name, venue_name: venue || null, starts_at: startsAt, kind: "ceremony", visibility: "public", sort_order: events.length });
    setName(""); setVenue(""); setDate(""); setTime("12:00"); load();
  };
  const del = async (id: string) => { await supabase.from("events").delete().eq("id", id); load(); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Events</h2>
      <div className="space-y-3 mb-8">
        {events.map((ev) => <div key={ev.id} className="border border-onyx/10 bg-card p-4 rounded-md flex justify-between items-start"><div><h3 className="font-serif text-onyx">{ev.name}</h3><p className="text-sepia text-sm">{formatEventDate(ev.starts_at, "en")} · {formatEventTime(ev.starts_at)}</p>{ev.venue_name && <p className="text-sepia/70 text-sm">{ev.venue_name}</p>}</div><button onClick={() => del(ev.id)} className="text-red-600 text-sm hover:opacity-70">Delete</button></div>)}
        {events.length === 0 && <p className="text-sepia/60 italic">No events yet.</p>}
      </div>
      <div className="border border-onyx/10 bg-card p-6 rounded-md space-y-3">
        <h3 className="text-sm uppercase tracking-widest text-sepia">Add Event</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
        <TimePicker12 value={time} onChange={setTime} />
        <button onClick={add} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">Add</button>
      </div>
    </div>
  );
}

function RsvpsTab({ wedding }: { wedding: Wedding }) {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  useEffect(() => { supabase.from("rsvps").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false }).then(({ data }) => setRsvps((data as Rsvp[]) ?? [])); }, [wedding.id]);
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">RSVPs</h2>
      {rsvps.length === 0 ? <p className="text-sepia/60 italic">No RSVPs yet.</p> : <div className="space-y-3">{rsvps.map((r) => <div key={r.id} className="border border-onyx/10 bg-card p-4 rounded-md"><div className="flex justify-between"><h3 className="font-serif text-onyx">{r.guest_name}</h3><span className={`text-xs uppercase tracking-widest ${r.status === "attending" ? "text-green-600" : "text-red-600"}`}>{r.status}</span></div>{r.meal_choice && <p className="text-sepia text-sm">Meal: {r.meal_choice}</p>}{r.message && <p className="text-sepia/70 text-sm italic mt-1">{r.message}</p>}</div>)}</div>}
    </div>
  );
}

function GuestsTab({ wedding }: { wedding: Wedding }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [name, setName] = useState("");
  const load = () => { supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at").then(({ data }) => setGuests((data as Guest[]) ?? [])); };
  useEffect(load, [wedding.id]);
  const add = async () => {
    if (!name) return;
    const username = name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);
    await supabase.from("guests").insert({ wedding_id: wedding.id, full_name: name, username, plus_one_allowed: false });
    setName(""); load();
  };
  const genUsername = async (g: Guest) => { const u = g.full_name.toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 10000); await supabase.from("guests").update({ username: u }).eq("id", g.id); load(); };
  const del = async (id: string) => { await supabase.from("guests").delete().eq("id", id); load(); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Guest List</h2>
      <div className="space-y-2 mb-8">
        {guests.map((g) => <div key={g.id} className="flex items-center justify-between border border-onyx/10 bg-card p-3 rounded-md"><div><span className="text-onyx">{g.full_name}</span><span className="text-sepia text-sm ml-2">@{g.username ?? "—"}</span></div><div className="flex gap-2">{!g.username && <button onClick={() => genUsername(g)} className="text-sepia text-sm hover:text-onyx">Generate</button>}<button onClick={() => del(g.id)} className="text-red-600 text-sm hover:opacity-70">Delete</button></div></div>)}
        {guests.length === 0 && <p className="text-sepia/60 italic">No guests yet.</p>}
      </div>
      <div className="border border-onyx/10 bg-card p-6 rounded-md flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" className="flex-1 border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /><button onClick={add} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">Add</button></div>
    </div>
  );
}

function GroupsTab({ wedding }: { wedding: Wedding }) {
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [name, setName] = useState("");
  const load = () => { supabase.from("guest_groups").select("*").eq("wedding_id", wedding.id).order("sort_order").then(({ data }) => setGroups((data as GuestGroup[]) ?? [])); };
  useEffect(load, [wedding.id]);
  const add = async () => { if (!name) return; await supabase.from("guest_groups").insert({ wedding_id: wedding.id, name, sort_order: groups.length }); setName(""); load(); };
  const del = async (id: string) => { await supabase.from("guest_groups").delete().eq("id", id); load(); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Groups</h2>
      <div className="space-y-2 mb-6">
        {groups.map((g) => <div key={g.id} className="flex justify-between border border-onyx/10 bg-card p-3 rounded-md"><span className="text-onyx">{g.name}</span><button onClick={() => del(g.id)} className="text-red-600 text-sm">Delete</button></div>)}
        {groups.length === 0 && <p className="text-sepia/60 italic">No groups yet.</p>}
      </div>
      <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="flex-1 border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /><button onClick={add} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">Add</button></div>
    </div>
  );
}

function SigninEditor({ wedding }: { wedding: Wedding }) {
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Guest Login</h2>
      <div className="border border-onyx/10 bg-card p-6 rounded-md">
        <p className="text-sepia text-sm leading-relaxed">Guests sign in with their unique username. Usernames must be unique per wedding — add each guest under the <strong>Guest List</strong> tab and use the generate button to create usernames.</p>
        <div className="mt-4"><label className="text-xs uppercase tracking-widest text-sepia">Sign-in URL</label><a href={`/w/${wedding.slug}/signin`} target="_blank" className="block text-onyx underline text-sm mt-1">{window.location.origin}/w/{wedding.slug}/signin</a></div>
      </div>
    </div>
  );
}

function AppearanceTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const content = (wedding.content ?? {}) as WeddingContent;
  const [styles, setStyles] = useState<Record<string, any>>((content.text_styles as Record<string, any>) ?? {});
  const updateStyle = (key: string, prop: string, val: string) => { const m = { ...styles, [key]: { ...styles[key], [prop]: val } }; setStyles(m); saveContent(wedding.id, { ...content, text_styles: m }, qc); };
  const applyPreset = (preset: typeof THEME_PRESETS[number]) => { saveContent(wedding.id, { ...content, theme_preset: preset.name }, qc); };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Appearance</h2>
      <div className="space-y-8">
        <section>
          <h3 className="text-sm uppercase tracking-widest text-sepia mb-3">Presets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {THEME_PRESETS.map((p) => <button key={p.name} onClick={() => applyPreset(p)} className="border border-onyx/10 rounded-md p-3 text-center hover:border-sepia/40 transition-colors" style={{ background: p.bg }}><div className="h-8 rounded mb-2" style={{ background: p.accent }} /><span className="text-xs text-onyx">{p.name}</span></button>)}
          </div>
        </section>
        <section>
          <h3 className="text-sm uppercase tracking-widest text-sepia mb-3">Typography</h3>
          <div className="space-y-4">
            {["cover_heading", "cover_subtitle", "invitation_text"].map((key) => (
              <div key={key} className="border border-onyx/10 bg-card p-4 rounded-md">
                <h4 className="text-xs uppercase tracking-widest text-sepia mb-2">{key.replace(/_/g, " ")}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <select value={styles[key]?.fontFamily ?? ""} onChange={(e) => updateStyle(key, "fontFamily", e.target.value)} className="border border-onyx/20 p-2 text-sm bg-transparent"><option value="">Default</option>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
                  <input type="color" value={styles[key]?.color ?? "#1a1a1a"} onChange={(e) => updateStyle(key, "color", e.target.value)} className="border border-onyx/20 p-1 h-10" />
                  <input value={styles[key]?.size ?? ""} onChange={(e) => updateStyle(key, "size", e.target.value)} placeholder="Size (e.g. 2rem)" className="border border-onyx/20 p-2 text-sm bg-transparent" />
                  <select value={styles[key]?.weight ?? ""} onChange={(e) => updateStyle(key, "weight", e.target.value)} className="border border-onyx/20 p-2 text-sm bg-transparent"><option value="">Default weight</option><option value="300">Light</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option></select>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SiteTab({ wedding }: { wedding: Wedding }) {
  const qc = useQueryClient();
  const [name1, setName1] = useState(wedding.couple_name_one);
  const [name2, setName2] = useState(wedding.couple_name_two);
  const [date, setDate] = useState(wedding.wedding_date ?? "");
  const [location, setLocation] = useState(wedding.location ?? "");
  const [heroUrl, setHeroUrl] = useState(wedding.hero_image_url ?? "");
  const [story, setStory] = useState(wedding.story ?? "");
  const [hashtag, setHashtag] = useState(wedding.hashtag ?? "");
  const [published, setPublished] = useState(wedding.is_published);
  const save = async () => {
    await supabase.from("weddings").update({ couple_name_one: name1, couple_name_two: name2, wedding_date: date || null, location: location || null, hero_image_url: heroUrl || null, story: story || null, is_published: published, hashtag: hashtag || null }).eq("id", wedding.id);
    qc.invalidateQueries({ queryKey: ["weddings"] });
  };
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">General Settings</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name One"><input value={name1} onChange={(e) => setName1(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
          <Field label="Name Two"><input value={name2} onChange={(e) => setName2(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        </div>
        <Field label="Wedding Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <Field label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <div><label className="text-xs uppercase tracking-widest text-sepia">Hero Image</label><ImageUpload weddingId={wedding.id} value={heroUrl || null} onChange={(url) => setHeroUrl(url ?? "")} /></div>
        <Field label="Story"><textarea value={story} onChange={(e) => setStory(e.target.value)} rows={4} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <Field label="Hashtag"><input value={hashtag} onChange={(e) => setHashtag(e.target.value)} className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" /></Field>
        <label className="flex items-center gap-2"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> <span className="text-sm text-onyx">Published</span></label>
        <button onClick={save} className="bg-onyx text-parchment px-4 py-2 text-xs uppercase tracking-widest hover:bg-ink">Save</button>
      </div>
    </div>
  );
}

function PublicWebsiteTab({ wedding }: { wedding: Wedding }) {
  return (
    <div>
      <h2 className="text-xl font-serif text-onyx mb-6">Share</h2>
      <div className="space-y-6">
        <QrCodePanel url={`${window.location.origin}/w/${wedding.slug}`} title="Wedding Website" />
        <QrCodePanel url={`${window.location.origin}/w/${wedding.slug}/signin`} title="Guest Sign-in" />
      </div>
    </div>
  );
}
