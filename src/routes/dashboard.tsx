import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, EVENT_TYPES, EVENT_TEMPLATES } from "../lib/supabase";
import { RUSTY_THEME } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Card, Badge, EmptyState, Skeleton, Modal, Toast } from "../components/ui";
import { SiteHeader } from "../components/site/SiteHeader";
import { Plus, Trash2, Pencil, Eye, Calendar } from "lucide-react";
import { formatDateShort, getEventStatus } from "../lib/utils";

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({ name: "", event_type: "Wedding", template_id: "default" });

  const { data: session } = useQuery({ queryKey: ["session"], queryFn: async () => { const { data } = await supabase.auth.getSession(); return data.session; } });

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase.from("user_events").select("*").eq("creator_id", session.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
    enabled: !!session?.user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("user_events").insert({ name: newEvent.name, event_type: newEvent.event_type, template_id: newEvent.template_id, creator_id: session?.user?.id, theme: newEvent.template_id === "rusty" ? RUSTY_THEME : {} }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["events"] }); setShowCreate(false); setNewEvent({ name: "", event_type: "Wedding", template_id: "default" }); navigate(`/event/${data.id}`); },
    onError: (err: Error) => { setToast(`Failed to create event: ${err.message}`); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("user_events").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setDeleteId(null); setToast("Event deleted"); },
    onError: (err: Error) => { setToast(`Failed to delete: ${err.message}`); setDeleteId(null); },
  });

  if (!session) {
    return (<div className="min-h-screen bg-white"><SiteHeader /><div className="max-w-md mx-auto px-6 py-20 text-center"><h1 className="font-heading text-3xl mb-4">Sign in to continue</h1><p className="text-sm text-gray-500 mb-8">You need an account to manage your events.</p><Link to="/auth"><Button>Sign In</Button></Link></div></div>);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8"><div><h1 className="font-heading text-3xl">Your Events</h1><p className="text-sm text-gray-500 mt-1">Manage your wedding invitations</p></div><Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Event</Button></div>
        {isLoading ? (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}</div>
        ) : !events || events.length === 0 ? (
          <EmptyState icon={<Calendar className="w-12 h-12" />} title="No events yet" description="Create your first wedding invitation to get started." action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Event</Button>} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const status = getEventStatus(event.draft_event_date || event.event_date);
              return (
                <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-40 bg-gray-100 relative overflow-hidden">
                    {event.cover_image ? <img src={event.cover_image} alt={event.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-900"><span className="font-heading text-4xl text-white">{event.name.charAt(0)}</span></div>}
                    <div className="absolute top-3 right-3"><Badge variant={event.is_published ? "success" : "default"}>{event.is_published ? "Published" : "Draft"}</Badge></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-heading text-xl mb-1">{event.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3"><span>{event.event_type}</span>{event.event_date && <span>· {formatDateShort(event.event_date)}</span>}<Badge variant={status === "upcoming" ? "info" : status === "completed" ? "default" : "success"}>{status}</Badge></div>
                    <div className="flex items-center gap-2">
                      <Link to={`/event/${event.id}`}><Button size="sm" variant="secondary"><Pencil className="w-3.5 h-3.5" /> Edit</Button></Link>
                      {event.is_published && event.slug && <Link to={`/e/${event.slug}`} target="_blank"><Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /> View</Button></Link>}
                      <button onClick={() => setDeleteId(event.id)} className="ml-auto p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <div className="space-y-4">
          <div><label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Event Name</label><Input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="John & Jane's Wedding" /></div>
          <div><label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Event Type</label><Select value={newEvent.event_type} onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}>{EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
          <div><label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Template</label><Select value={newEvent.template_id} onChange={(e) => setNewEvent({ ...newEvent, template_id: e.target.value })}>{EVENT_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></div>
          <div className="flex gap-3 pt-2"><Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newEvent.name}>Create Event</Button><Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button></div>
        </div>
      </Modal>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Event">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
        <div className="flex gap-3"><Button variant="danger" onClick={() => deleteMutation.mutate(deleteId!)} loading={deleteMutation.isPending}>Delete</Button><Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button></div>
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
