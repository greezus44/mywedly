import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input, Textarea, Select } from "../components/ui/Input";
import { Modal, Badge, EmptyState } from "../components/ui";
import { formatDateShort } from "../lib/utils";
import { slugify } from "../lib/theme";

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("other");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/auth");
    });
  }, [navigate]);

  const { data: events, isLoading } = useQuery({
    queryKey: ["user-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserEvent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .insert({
          name: newName,
          event_type: newType,
          event_date: newDate || null,
          draft_name: newName,
          draft_event_type: newType,
          draft_event_date: newDate || null,
          draft_slug: slugify(newName),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      setShowCreate(false);
      setNewName("");
      setNewDate("");
      navigate(`/event/${data.id}`);
    },
  });

  return (
    <div className="min-h-screen bg-dash-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-dash-text">Your Invitation Websites</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                supabase.auth.signOut();
                navigate("/auth");
              }}
            >
              Sign out
            </Button>
            <Button onClick={() => setShowCreate(true)}>+ Create Website</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl border border-dash-border bg-dash-surface animate-pulse" />
            ))}
          </div>
        ) : events && events.length === 0 ? (
          <EmptyState
            title="No invitation websites yet"
            description="Create your first invitation website to get started."
            action={<Button onClick={() => setShowCreate(true)}>+ Create Website</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events?.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="group rounded-xl border border-dash-border bg-dash-surface p-5 hover:border-dash-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-dash-text group-hover:text-dash-primary transition-colors">
                    {event.name}
                  </h3>
                  {event.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="default">Draft</Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-dash-muted">
                  {event.event_date && <p>{formatDateShort(event.event_date)}</p>}
                  {event.venue && <p>{event.venue}</p>}
                  <p className="capitalize">Type: {event.event_type}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Invitation Website">
        <div className="space-y-4">
          <Input
            label="Website Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., John & Sarah's Wedding"
            autoFocus
          />
          <Select label="Event Type" value={newType} onChange={(e) => setNewType(e.target.value)}>
            <option value="wedding">Wedding</option>
            <option value="conference">Conference</option>
            <option value="birthday">Birthday</option>
            <option value="festival">Festival</option>
            <option value="corporate">Corporate Event</option>
            <option value="charity">Charity Event</option>
            <option value="graduation">Graduation</option>
            <option value="reunion">Family Reunion</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="Event Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              loading={createMutation.isPending}
              disabled={!newName.trim()}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
