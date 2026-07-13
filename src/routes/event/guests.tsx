import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import {
  Button, Card, Input, Select, Badge, EmptyState, ErrorState, LoadingSpinner,
} from "../../components/ui";
import { GuestFormModal } from "./guest-form";

export default function GuestsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");

  const { data: guests, isLoading, isError, refetch } = useQuery({
    queryKey: ["event_guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", event.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const groupMap = useMemo(() => {
    const map = new Map<string, string>();
    (groups ?? []).forEach((g) => map.set(g.id, g.name));
    return map;
  }, [groups]);

  const groupedGuests = useMemo(() => {
    const filtered = (guests ?? []).filter((g) => {
      const matchesSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (g.username ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesGroup =
        filterGroup === "all" || g.group_id === filterGroup || g.group_name === filterGroup;
      return matchesSearch && matchesGroup;
    });
    const groupsMap = new Map<string, EventGuest[]>();
    filtered.forEach((g) => {
      const key = g.group_id ? groupMap.get(g.group_id) ?? "Unknown Group" : g.group_name || "Ungrouped";
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(g);
    });
    return Array.from(groupsMap.entries());
  }, [guests, search, filterGroup, groupMap]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", event.id] });
    },
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (g: EventGuest) => { setEditing(g); setModalOpen(true); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message="Failed to load guests." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted">Manage your guest list and track RSVPs.</p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or username…" className="flex-1" />
        <Select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="sm:w-48">
          <option value="all">All Groups</option>
          {(groups ?? []).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
        </Select>
      </div>

      {groupedGuests.length === 0 && (
        <EmptyState
          title={guests?.length ? "No matching guests" : "No guests yet"}
          description={guests?.length ? "Try adjusting your search or filter." : "Add guests to your event to start tracking RSVPs."}
          icon={<span className="text-4xl">👥</span>}
          action={!guests?.length ? <Button onClick={openCreate}>Add Guest</Button> : undefined}
        />
      )}

      {groupedGuests.length > 0 && (
        <div className="space-y-4">
          {groupedGuests.map(([groupName, groupGuests]) => (
            <div key={groupName}>
              <h3 className="mb-2 text-sm font-semibold text-dash-text">
                {groupName} <span className="text-dash-muted">({groupGuests.length})</span>
              </h3>
              <div className="space-y-2">
                {groupGuests.map((g) => (
                  <Card key={g.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-dash-text">{g.name}</span>
                        <Badge variant={
                          g.rsvp_status === "attending" || g.rsvp_status === "yes" ? "success"
                            : g.rsvp_status === "declined" || g.rsvp_status === "no" ? "danger" : "warning"
                        }>
                          {g.rsvp_status}
                        </Badge>
                        {g.plus_ones > 0 && <span className="text-xs text-dash-muted">+{g.plus_ones}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-dash-muted">
                        {g.username && <span>@{g.username}</span>}
                        {g.email && <span>✉ {g.email}</span>}
                        {g.phone && <span>☎ {g.phone}</span>}
                        {g.side && <span>{g.side}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(g)}>Edit</Button>
                      <Button size="sm" variant="danger" loading={deleteMutation.isPending}
                        onClick={() => { if (confirm(`Delete guest "${g.name}"?`)) deleteMutation.mutate(g.id); }}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <GuestFormModal
        event={event}
        editing={editing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
