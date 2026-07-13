import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EVENT_TYPES, EventType, EVENT_TEMPLATES, TemplateId } from "../lib/supabase";
import { DEFAULT_THEME, DEFAULT_COVER_CONFIG, DEFAULT_LOGIN_CONFIG, DEFAULT_LOGO_CONFIG, DEFAULT_CONTENT, DEFAULT_SHARING_CONFIG, RUSTY_THEME, RUSTY_COVER_CONFIG, RUSTY_LOGIN_CONFIG, RUSTY_CONTENT, slugify } from "../lib/theme";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal, FormField, Toast, Skeleton, ErrorState, EmptyState, Badge } from "../components/ui/index";
import { DatePicker } from "../components/ui/DatePicker";
import { Plus, Search, MoreVertical, Copy, Archive, Trash2, Calendar } from "lucide-react";
import { formatDateShort, cn } from "../lib/utils";

function normalizeEvent(data: any): UserEvent {
  return { ...data, cover_config: data.cover_config || {}, login_config: data.login_config || {}, theme: data.theme || {}, logo_config: data.logo_config || {}, content: data.content || {}, sharing_config: data.sharing_config || {}, draft_cover_config: data.draft_cover_config || data.cover_config || {}, draft_login_config: data.draft_login_config || data.login_config || {}, draft_theme: data.draft_theme || data.theme || {}, draft_logo_config: data.draft_logo_config || data.logo_config || {}, draft_content: data.draft_content || data.content || {}, draft_sharing_config: data.draft_sharing_config || data.sharing_config || {} };
}

function getTemplateDefaults(templateId: string) {
  if (templateId === "rusty") return { theme: RUSTY_THEME, cover: RUSTY_COVER_CONFIG, login: RUSTY_LOGIN_CONFIG, content: RUSTY_CONTENT };
  return { theme: DEFAULT_THEME, cover: DEFAULT_COVER_CONFIG, login: DEFAULT_LOGIN_CONFIG, content: DEFAULT_CONTENT };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: events, isLoading, error, refetch } = useQuery<UserEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(normalizeEvent);
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; event_type: EventType; event_date: string | null; template_id: TemplateId }) => {
      const defaults = getTemplateDefaults(input.template_id);
      const slug = slugify(input.name);
      const { data, error } = await supabase.from("user_events").insert({
        name: input.name, event_type: input.event_type, event_date: input.event_date, template_id: input.template_id,
        draft_slug: slug, draft_event_date: input.event_date,
        draft_cover_config: defaults.cover, draft_login_config: defaults.login, draft_theme: defaults.theme,
        draft_logo_config: DEFAULT_LOGO_CONFIG, draft_content: defaults.content, draft_sharing_config: DEFAULT_SHARING_CONFIG,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["events"] }); setShowCreate(false); navigate(`/event/${data.id}/cover`); },
    onError: (err: any) => { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (event: UserEvent) => {
      const { id, created_at, updated_at, published_at, ...rest } = event;
      const { data, error } = await supabase.from("user_events").insert({ ...rest, name: `${event.name} (Copy)`, is_published: false, published_at: null, slug: null, draft_slug: slugify(`${event.name} (Copy)`) }).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setToast("Duplicated!"); setTimeout(() => setToast(null), 3000); },
  });

  const archiveMutation = useMutation({
    mutationFn: async (event: UserEvent) => { const { error } = await supabase.from("user_events").update({ is_archived: !event.is_archived }).eq("id", event.id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => { const { error } = await supabase.from("user_events").delete().eq("id", eventId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setToast("Deleted"); setTimeout(() => setToast(null), 3000); },
  });

  const filtered = (events || []).filter(e => {
    if (e.is_archived) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "published" && !e.is_published) return false;
    if (statusFilter === "draft" && e.is_published) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-sm"><span className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold">E</span> Event Studio</Link>
          <div className="flex items-center gap-3">
            <Link to="/account" className="text-sm text-gray-500 hover:text-black transition-colors">Account</Link>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Event</Button>
          </div>
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Your Events</h1>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-gray-900 w-40 sm:w-56" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-gray-900 bg-white"><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select>
          </div>
        </div>
        {isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>}
        {error && <ErrorState message="Could not load events" onRetry={() => refetch()} />}
        {!isLoading && !error && filtered.length === 0 && <EmptyState title="No events yet" description="Create your first event to get started." action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Event</Button>} />}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(event => (
              <div key={event.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                <div className="h-32 bg-gray-100 relative cursor-pointer" onClick={() => navigate(`/event/${event.id}/cover`)}>
                  {event.cover_image ? <img src={event.cover_image} alt={event.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Calendar className="w-8 h-8 text-gray-300" /></div>}
                  <div className="absolute top-2 right-2">{event.is_published ? <Badge variant="success">Published</Badge> : <Badge>Draft</Badge>}</div>
                  {event.template_id === "rusty" && <div className="absolute top-2 left-2"><Badge variant="info">Rusty</Badge></div>}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/event/${event.id}/cover`)}>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{event.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{event.event_type}</p>
                      {event.event_date && <p className="text-xs text-gray-400 mt-0.5">{formatDateShort(event.event_date)}</p>}
                    </div>
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === event.id ? null : event.id); }} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><MoreVertical className="w-4 h-4 text-gray-400" /></button>
                      {menuOpen === event.id && (<><div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} /><div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"><button onClick={() => { duplicateMutation.mutate(event); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Duplicate</button><button onClick={() => { archiveMutation.mutate(event); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Archive className="w-3.5 h-3.5" /> Archive</button><button onClick={() => { deleteMutation.mutate(event.id); setMenuOpen(null); }} className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button></div></>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreate={(input) => createMutation.mutate(input)} creating={createMutation.isPending} />}
      {toast && <Toast message={toast} type={toast.includes("Failed") || toast.includes("Deleted") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}

function CreateEventModal({ onClose, onCreate, creating }: { onClose: () => void; onCreate: (input: { name: string; event_type: EventType; event_date: string | null; template_id: TemplateId }) => void; creating: boolean }) {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("wedding");
  const [date, setDate] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>("default");
  const [selectedTemplate, setSelectedTemplate] = useState("wedding-classic");

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplate(tplId);
    const tpl = EVENT_TEMPLATES.find(t => t.id === tplId);
    if (tpl) { setTemplateId(tpl.template_id); setEventType(tpl.type); }
  };

  return (
    <Modal open={true} onClose={onClose} title="Create New Event">
      <div className="space-y-4">
        <FormField label="Event Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah & John's Wedding" autoFocus /></FormField>
        <FormField label="Event Type"><Select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>{EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></FormField>
        <DatePicker value={date} onChange={setDate} label="Event Date" />
        <FormField label="Template">
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {EVENT_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => handleTemplateSelect(t.id)} className={cn("p-3 text-left rounded-lg border transition-colors", selectedTemplate === t.id ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300")}>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-gray-500">{t.description}</p>
                {t.template_id === "rusty" && <span className="inline-block mt-1 text-[10px] text-rusty-gold font-medium">Premium</span>}
              </button>
            ))}
          </div>
        </FormField>
        <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onCreate({ name: name || "Untitled Event", event_type: eventType, event_date: date, template_id: templateId })} loading={creating} disabled={!name.trim()}>Create Event</Button></div>
      </div>
    </Modal>
  );
}
