import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, EVENT_TYPES, EVENT_TEMPLATES, type UserEvent } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input, Select, Modal, Badge, EmptyState, Card } from "../components/ui";
import { Plus, Calendar, Users, ExternalLink } from "lucide-react";
import { formatDateShort, getEventStatus } from "../lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("other");
  const [newTemplate, setNewTemplate] = useState("default");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("user_events").insert({
        name: newName,
        event_type: newType,
        template_id: newTemplate,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowCreate(false);
      setNewName("");
      navigate(`/event/${data.id}/cover`);
    },
    onError: (err: any) => alert("Failed to create event: " + (err.message || "Unknown error")),
  });

  return (
    <div className="min-h-screen bg-dash-bg">
      <header className="bg-dash-surface border-b border-dash-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-dash-text">My Events</h1>
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Event</Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-dash-muted">Loading...</div>
        ) : !events || events.length === 0 ? (
          <EmptyState icon={<Calendar className="w-12 h-12" />} title="No events yet" description="Create your first event to get started." action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Event</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" >
                <div onClick={() => navigate(`/event/${event.id}/cover`)}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-dash-text">{event.name}</h3>
                    <Badge variant={event.is_published ? "success" : "default"}>{getEventStatus(event)}</Badge>
                  </div>
                  <p className="text-sm text-dash-muted">{formatDateShort(event.event_date)}</p>
                  {event.venue && <p className="text-sm text-dash-muted">{event.venue}</p>}
                </div>
                {event.is_published && event.slug && (
                  <a href={`/e/${event.slug}`} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-xs text-teal-700 hover:underline">
                    <ExternalLink className="w-3 h-3" /> View Guest Page
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Event">
        <div className="space-y-4">
          <Input placeholder="Event name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Select value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)}>
            {EVENT_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newName.trim()} className="w-full">Create Event</Button>
        </div>
      </Modal>
    </div>
  );
}
