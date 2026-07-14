import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";
import {
  emptyForm, RsvpBadge, GuestFormFields, guestToForm,
  type GuestForm,
} from "./guest-form";

export default function GuestsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [form, setForm] = useState<GuestForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests").select("*").eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups").select("*").eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const groupMap = useMemo(() => {
    const map: Record<string, string> = {};
    groups?.forEach((g) => { map[g.id] = g.name; });
    return map;
  }, [groups]);

  function getGroupName(guest: EventGuest): string {
    if (guest.group_id && groupMap[guest.group_id]) return groupMap[guest.group_id];
    return guest.group_name ?? "Ungrouped";
  }

  const filtered = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      const matchSearch = !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (g.username ?? "").toLowerCase().includes(search.toLowerCase());
      const matchGroup = filterGroupId === "all" || g.group_id === filterGroupId;
      return matchSearch && matchGroup;
    });
  }, [guests, search, filterGroupId]);

  const grouped = useMemo(() => {
    const map: Record<string, EventGuest[]> = {};
    filtered.forEach((g) => {
      const key = g.group_id ?? "ungrouped";
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return map;
  }, [filtered]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId, name: form.name,
        username: form.username || null, email: form.email || null,
        phone: form.phone || null, group_id: form.group_id,
        group_name: form.group_id ? (groupMap[form.group_id] ?? form.group_name) : (form.group_name || null),
        side: form.side || null, plus_ones: form.plus_ones,
        rsvp_status: "pending", token: crypto.randomUUID(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_guests").update({
        name: form.name, username: form.username || null,
        email: form.email || null, phone: form.phone || null,
        group_id: form.group_id,
        group_name: form.group_id ? (groupMap[form.group_id] ?? form.group_name) : (form.group_name || null),
        side: form.side || null, plus_ones: form.plus_ones,
      }).eq("id", editing!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }),
  });

  async function checkUsernameUnique(username: string): Promise<boolean> {
    if (!username) return true;
    const { data, error } = await supabase
      .from("event_guests").select("id").eq("event_id", eventId)
      .eq("username", username).neq("id", editing?.id ?? "").maybeSingle();
    if (error) return true;
    return !data;
  }

  function openCreate() {
    setEditing(null); setForm(emptyForm); setUsernameError(null); setShowModal(true);
  }

  function openEdit(guest: EventGuest) {
    setEditing(guest); setForm(guestToForm(guest)); setUsernameError(null); setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.username) {
      const isUnique = await checkUsernameUnique(form.username);
      if (!isUnique) { setUsernameError("This username is already taken."); return; }
    }
    setUsernameError(null);
    if (editing) updateMutation.mutate(); else createMutation.mutate();
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const saveError = editing ? updateMutation.error : createMutation.error;

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (isError) return <div className="py-20"><ErrorState message={error?.message} /></div>;

  const groupEntries = Object.entries(grouped).sort(([a], [b]) => {
    if (a === "ungrouped") return 1;
    if (b === "ungrouped") return -1;
    return (groupMap[a] ?? "").localeCompare(groupMap[b] ?? "");
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">
            {guests?.length ?? 0} total guests for {event.name}.
          </p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Search by name, email, or username..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={filterGroupId} onChange={(e) => setFilterGroupId(e.target.value)} className="sm:w-48">
          <option value="all">All groups</option>
          {groups?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          <option value="ungrouped">Ungrouped</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={guests && guests.length > 0 ? "No matching guests" : "No guests yet"}
          description={guests && guests.length > 0
            ? "Try adjusting your search or filter."
            : "Add guests to your event and organize them into groups."}
          action={guests && guests.length === 0 ? <Button onClick={openCreate}>Add Guest</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {groupEntries.map(([groupId, groupGuests]) => {
            const groupName = groupId === "ungrouped" ? "Ungrouped" : (groupMap[groupId] ?? "Unknown");
            const isCollapsed = collapsedGroups[groupId] ?? false;
            return (
              <div key={groupId}>
                <button
                  onClick={() => setCollapsedGroups({ ...collapsedGroups, [groupId]: !isCollapsed })}
                  className="mb-2 flex w-full items-center gap-2 text-sm font-semibold text-dash-text">
                  <svg className={cn("h-4 w-4 transition-transform", isCollapsed ? "" : "rotate-90")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  {groupName}
                  <Badge variant="default">{groupGuests.length}</Badge>
                </button>
                {!isCollapsed && (
                  <div className="space-y-2">
                    {groupGuests.map((guest) => (
                      <Card key={guest.id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dash-bg text-sm font-medium text-dash-muted">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dash-text">{guest.name}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-dash-muted">
                              {guest.username && <span>@{guest.username}</span>}
                              {guest.email && <span>{guest.email}</span>}
                              {guest.plus_ones > 0 && <span>+{guest.plus_ones} guests</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RsvpBadge status={guest.rsvp_status} />
                          <Button size="sm" variant="ghost" onClick={() => openEdit(guest)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(guest.id)}>Delete</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? "Edit Guest" : "Add Guest"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <GuestFormFields form={form} setForm={setForm} groups={groups ?? []}
            groupMap={groupMap} usernameError={usernameError} setUsernameError={setUsernameError} />
          {saveError && (
            <p className="text-sm text-red-600">
              {saveError instanceof Error ? saveError.message : "Save failed."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Update" : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
