import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Plus, Search, Copy, Archive, Trash2, MoreVertical, Calendar, Users, Mail,
  CheckCircle, Clock, X, LayoutGrid,
} from "lucide-react";
import { supabase, UserEvent, EVENT_TYPES, EVENT_TEMPLATES } from "../lib/supabase";
import { DEFAULT_THEME, DEFAULT_COVER_CONFIG, DEFAULT_LOGIN_CONFIG, DEFAULT_LOGO_CONFIG, DEFAULT_CONTENT, DEFAULT_SHARING_CONFIG } from "../lib/theme";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Card, Badge, Modal, FormField, ImageUpload, EmptyState, Skeleton, Toast, ErrorState } from "../components/ui/index";
import { DatePicker } from "../components/ui/DatePicker";
import { cn, formatDateShort } from "../lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "true");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Create wizard state
  const [wizName, setWizName] = useState("");
  const [wizType, setWizType] = useState("wedding");
  const [wizDate, setWizDate] = useState<string | null>(null);
  const [wizCover, setWizCover] = useState("");
  const [wizTemplate, setWizTemplate] = useState("wedding");

  const { data: events, isLoading, error, refetch } = useQuery<UserEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return []; }
      const { data, error } = await supabase.from("user_events").select("*").eq("is_archived", false).order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as UserEvent[];
    },
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("user_events").insert({
        creator_id: user.id,
        name: wizName || "Untitled Event",
        event_type: wizType,
        event_date: wizDate,
        cover_image: wizCover || null,
        cover_config: DEFAULT_COVER_CONFIG,
        login_config: DEFAULT_LOGIN_CONFIG,
        theme: DEFAULT_THEME,
        logo_config: DEFAULT_LOGO_CONFIG,
        content: DEFAULT_CONTENT,
        sharing_config: DEFAULT_SHARING_CONFIG,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setCreateOpen(false);
      setWizName(""); setWizType("wedding"); setWizDate(null); setWizCover(""); setWizTemplate("wedding");
      navigate(`/event/${data.id}/cover`);
    },
    onError: (err: any) => {
      setToast("Failed to create event: " + err.message);
      setTimeout(() => setToast(null), 3000);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const original = events?.find(e => e.id === eventId);
      if (!original) throw new Error("Event not found");
      const { data, error } = await supabase.from("user_events").insert({
        creator_id: original.creator_id,
        name: `${original.name} (Copy)`,
        event_type: original.event_type,
        event_date: original.event_date,
        event_time: original.event_time,
        venue: original.venue,
        address: original.address,
        cover_image: original.cover_image,
        cover_config: original.cover_config,
        login_config: original.login_config,
        theme: original.theme,
        logo_config: original.logo_config,
        content: original.content,
        sharing_config: original.sharing_config,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast("Event duplicated!");
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: any) => { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); },
  });

  const archiveMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("user_events").update({ is_archived: true }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setToast("Event archived!"); setTimeout(() => setToast(null), 3000); },
    onError: (err: any) => { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["events"] }); setToast("Event deleted!"); setTimeout(() => setToast(null), 3000); },
    onError: (err: any) => { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); },
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter(e => {
      if (statusFilter === "published" && !e.is_published) return false;
      if (statusFilter === "draft" && e.is_published) return false;
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [events, statusFilter, searchQuery]);

  useEffect(() => {
    if (searchParams.get("create") === "true") setCreateOpen(true);
  }, [searchParams]);

  const handleCreate = useCallback(() => {
    createMutation.mutate();
  }, [createMutation]);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">E</div>
            <span className="font-semibold text-gray-900 text-sm">Event Studio</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign Out</Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {/* Title bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Events</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage all your event websites in one place</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Create Event</Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events..." className="pl-9" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-36">
            <option value="all">All Events</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
        </div>

        {/* Events grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="w-12 h-12" />}
            title={searchQuery ? "No events found" : "No events yet"}
            description={searchQuery ? "Try a different search" : "Create your first event to get started"}
            action={!searchQuery && <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Create Event</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onOpen={() => navigate(`/event/${event.id}/cover`)}
                onDuplicate={() => duplicateMutation.mutate(event.id)}
                onArchive={() => archiveMutation.mutate(event.id)}
                onDelete={() => deleteMutation.mutate(event.id)}
                menuOpen={menuOpenId === event.id}
                onMenuToggle={() => setMenuOpenId(menuOpenId === event.id ? null : event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create wizard modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setSearchParams({}); }} title="Create New Event" size="lg">
        <div className="space-y-5">
          <FormField label="Event Name">
            <Input value={wizName} onChange={(e) => setWizName(e.target.value)} placeholder="e.g. Sarah & John's Wedding" autoFocus />
          </FormField>

          <FormField label="Event Type">
            <Select value={wizType} onChange={(e) => setWizType(e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </FormField>

          <DatePicker value={wizDate} onChange={setWizDate} label="Event Date" />

          <FormField label="Cover Image (optional)">
            <ImageUpload value={wizCover} onChange={setWizCover} />
          </FormField>

          <FormField label="Website Template">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {EVENT_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setWizTemplate(tpl.id)}
                  className={cn("flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors", wizTemplate === tpl.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50")}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{tpl.label[0]}</div>
                  <span className="text-xs text-gray-700">{tpl.label}</span>
                </button>
              ))}
            </div>
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setCreateOpen(false); setSearchParams({}); }}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>Create Event</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}

function EventCard({ event, onOpen, onDuplicate, onArchive, onDelete, menuOpen, onMenuToggle }: {
  event: UserEvent; onOpen: () => void; onDuplicate: () => void; onArchive: () => void; onDelete: () => void;
  menuOpen: boolean; onMenuToggle: () => void;
}) {
  const typeLabel = EVENT_TYPES.find(t => t.id === event.event_type)?.label || event.event_type;

  return (
    <Card className="overflow-hidden group relative">
      {/* Cover */}
      <div className="h-32 bg-gray-200 relative cursor-pointer" onClick={onOpen}>
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-2xl font-bold text-gray-400">{event.name[0]}</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          {event.is_published ? (
            <Badge color="green" className="bg-green-500/90 text-white">Published</Badge>
          ) : (
            <Badge color="yellow" className="bg-yellow-500/90 text-white">Draft</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate cursor-pointer hover:text-gray-700" onClick={onOpen}>{event.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{typeLabel}</p>
          </div>
          <div className="relative">
            <button onClick={onMenuToggle} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                <button onClick={() => { onDuplicate(); onMenuToggle(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                <button onClick={() => { onArchive(); onMenuToggle(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"><Archive className="w-3.5 h-3.5" /> Archive</button>
                <button onClick={() => { onDelete(); onMenuToggle(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-gray-500">
          {event.event_date && (
            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDateShort(event.event_date)}</div>
          )}
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Updated {formatDateShort(event.updated_at)}</div>
        </div>
      </div>
    </Card>
  );
}
