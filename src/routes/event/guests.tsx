import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type EventGuest,
  type GuestGroup,
  type SubEvent,
  type SubEventGroupAssignment,
  type GuestInvitationOverride,
} from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { cn, generateUsername } from "../../lib/utils";
import {
  EMPTY_GUEST_FORM,
  guestToForm,
  RsvpBadge,
  type GuestForm,
} from "./guest-form";

interface InvState {
  invited: boolean;
  source: "group" | "manual" | "none";
}

export default function Guests() {
  const { eventId } = useOutletContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_GUEST_FORM);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: guests, isLoading, isError } = useQuery({
    queryKey: ["event_guests", eventId], enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", eventId], enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", eventId], enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const guestIds = useMemo(() => guests?.map((g) => g.id) ?? [], [guests]);
  const subEventIds = useMemo(() => subEvents?.map((s) => s.id) ?? [], [subEvents]);

  const { data: assignments } = useQuery({
    queryKey: ["sub_event_group_assignments_all", eventId], enabled: subEventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("sub_event_group_assignments").select("*").in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest_invitation_overrides_all", eventId], enabled: guestIds.length > 0 && subEventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_invitation_overrides").select("*").in("guest_id", guestIds).in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const invitationMap = useMemo(() => {
    const map: Record<string, Record<string, InvState>> = {};
    const groupAssignments: Record<string, Set<string>> = {};
    assignments?.forEach((a) => {
      if (!groupAssignments[a.sub_event_id]) groupAssignments[a.sub_event_id] = new Set();
      groupAssignments[a.sub_event_id].add(a.group_id);
    });
    const overrideMap: Record<string, Record<string, boolean>> = {};
    overrides?.forEach((o) => {
      if (!overrideMap[o.guest_id]) overrideMap[o.guest_id] = {};
      overrideMap[o.guest_id][o.sub_event_id] = o.is_invited;
    });
    guests?.forEach((guest) => {
      map[guest.id] = {};
      subEvents?.forEach((subEvent) => {
        const assignedGroups = groupAssignments[subEvent.id] ?? new Set<string>();
        if (guest.id in overrideMap && subEvent.id in overrideMap[guest.id]) {
          map[guest.id][subEvent.id] = {
            invited: overrideMap[guest.id][subEvent.id],
            source: "manual",
          };
        } else if (guest.group_id && assignedGroups.has(guest.group_id)) {
          map[guest.id][subEvent.id] = { invited: true, source: "group" };
        } else {
          map[guest.id][subEvent.id] = { invited: false, source: "none" };
        }
      });
    });
    return map;
  }, [guests, subEvents, assignments, overrides]);

  const toggleOverride = useMutation({
    mutationFn: async ({ guestId, subEventId, currentlyInvited }: { guestId: string; subEventId: string; currentlyInvited: boolean }) => {
      const existing = overrides?.find((o) => o.guest_id === guestId && o.sub_event_id === subEventId);
      if (existing) {
        const { error } = await supabase.from("guest_invitation_overrides").update({ is_invited: !currentlyInvited }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guest_invitation_overrides").insert({ guest_id: guestId, sub_event_id: subEventId, is_invited: !currentlyInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest_invitation_overrides_all", eventId] }); },
  });

  const createGuestMutation = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID();
      const { data, error } = await supabase.from("event_guests").insert({
        event_id: eventId, name: form.name, username: form.username || null, email: form.email || null,
        phone: form.phone || null, group_id: form.group_id || null, group_name: form.group_name || null,
        side: form.side || null, plus_ones: form.plus_ones ?? 0, dietary: form.dietary || null,
        table_number: form.table_number ?? null, token, rsvp_status: "pending",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest_group_counts", eventId] });
      closeModal();
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No guest selected");
      const { data, error } = await supabase.from("event_guests").update({
        name: form.name, username: form.username || null, email: form.email || null, phone: form.phone || null,
        group_id: form.group_id || null, group_name: form.group_name || null, side: form.side || null,
        plus_ones: form.plus_ones ?? 0, dietary: form.dietary || null, table_number: form.table_number ?? null,
      }).eq("id", editingId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest_group_counts", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest_invitation_overrides_all", eventId] });
      closeModal();
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest_group_counts", eventId] });
    },
  });

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      const matchesSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.username ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesGroup = !filterGroup || g.group_id === filterGroup;
      return matchesSearch && matchesGroup;
    });
  }, [guests, search, filterGroup]);

  const groupedGuests = useMemo(() => {
    const result: Record<string, EventGuest[]> = {};
    filteredGuests.forEach((g) => {
      const key = g.group_id ?? "ungrouped";
      if (!result[key]) result[key] = [];
      result[key].push(g);
    });
    return result;
  }, [filteredGuests]);

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_GUEST_FORM);
    setEditingId(null);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(EMPTY_GUEST_FORM);
    setShowModal(true);
  };

  const handleEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setForm(guestToForm(guest));
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) updateGuestMutation.mutate();
    else createGuestMutation.mutate();
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (isError) return <ErrorState description="Failed to load guests" />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">
            {guests?.length ?? 0} guests · Click event chips to toggle invitations
          </p>
        </div>
        <Button onClick={handleAdd}>Add Guest</Button>
      </div>

      <div className="mb-4 flex gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="flex-1"
        />
        <Select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="w-48"
        >
          <option value="">All Groups</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      </div>

      {filteredGuests.length === 0 ? (
        <EmptyState
          title={guests?.length === 0 ? "No guests yet" : "No matching guests"}
          description={
            guests?.length === 0
              ? "Add guests to manage invitations and RSVPs."
              : "Try adjusting your search or filter."
          }
          icon={<span className="text-4xl">👥</span>}
          action={guests?.length === 0 ? <Button onClick={handleAdd}>Add Guest</Button> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(groupedGuests).map(([groupId, groupGuests]) => {
            const groupName = groupId === "ungrouped"
              ? "Ungrouped"
              : groups?.find((g) => g.id === groupId)?.name ?? "Unknown";
            const isCollapsed = collapsedGroups.has(groupId);
            return (
              <Card key={groupId} className="overflow-hidden">
                <button
                  onClick={() => toggleGroupCollapse(groupId)}
                  className="flex w-full items-center justify-between border-b border-dash-border bg-dash-bg px-4 py-2"
                >
                  <span className="text-sm font-semibold text-dash-text">
                    {groupName} ({groupGuests.length})
                  </span>
                  <svg className={cn("h-4 w-4 text-dash-muted transition-transform", isCollapsed ? "rotate-0" : "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-dash-border">
                    {groupGuests.map((guest) => {
                      const guestInvitations = invitationMap[guest.id] ?? {};
                      return (
                        <div key={guest.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-dash-text">{guest.name}</h3>
                                {guest.username && <span className="text-xs text-dash-muted">@{guest.username}</span>}
                                {guest.rsvp_status !== "pending" && <RsvpBadge status={guest.rsvp_status} />}
                              </div>
                              {guest.email && <p className="text-xs text-dash-muted">{guest.email}</p>}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(guest)}>Edit</Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteGuestMutation.mutate(guest.id)}>Delete</Button>
                            </div>
                          </div>
                          {subEvents && subEvents.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-1.5 text-xs text-dash-muted">Invited Events:</p>
                              <div className="flex flex-wrap gap-2">
                                {subEvents.map((subEvent) => {
                                  const state = guestInvitations[subEvent.id] ?? { invited: false, source: "none" as const };
                                  return (
                                    <button
                                      key={subEvent.id}
                                      onClick={() => toggleOverride.mutate({
                                        guestId: guest.id,
                                        subEventId: subEvent.id,
                                        currentlyInvited: state.invited,
                                      })}
                                      className={cn(
                                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                        state.invited
                                          ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                                          : "border-dash-border text-dash-muted hover:bg-dash-bg"
                                      )}
                                    >
                                      {subEvent.name}
                                      {state.source === "group" && <span className="ml-1 opacity-70">(Group)</span>}
                                      {state.source === "manual" && <span className="ml-1 opacity-70">(Manual)</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <GuestModal
        show={showModal}
        editingId={editingId}
        form={form}
        setForm={setForm}
        groups={groups}
        onClose={closeModal}
        onSave={handleSave}
        saving={createGuestMutation.isPending || updateGuestMutation.isPending}
        error={createGuestMutation.error?.message || updateGuestMutation.error?.message}
      />
    </div>
  );
}

function GuestModal({
  show,
  editingId,
  form,
  setForm,
  groups,
  onClose,
  onSave,
  saving,
  error,
}: {
  show: boolean;
  editingId: string | null;
  form: GuestForm;
  setForm: React.Dispatch<React.SetStateAction<GuestForm>>;
  groups: GuestGroup[] | undefined;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | undefined;
}) {
  return (
    <Modal open={show} onClose={onClose} title={editingId ? "Edit Guest" : "Add Guest"} size="lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Guest name"
          autoFocus
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-dash-text">Username</label>
          <div className="flex gap-2">
            <Input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="Auto-generated"
              className="flex-1"
            />
            <Button variant="secondary" size="md" onClick={() => setForm((f) => ({ ...f, username: generateUsername(form.name) }))} disabled={!form.name}>
              Generate
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="guest@example.com" />
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="555-0123" />
        </div>
        <Select
          label="Guest Group"
          value={form.group_id}
          onChange={(e) => {
            const group = groups?.find((g) => g.id === e.target.value);
            setForm((f) => ({ ...f, group_id: e.target.value, group_name: group?.name ?? "" }));
          }}
        >
          <option value="">No group</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Plus Ones" type="number" value={String(form.plus_ones)} onChange={(e) => setForm((f) => ({ ...f, plus_ones: Number(e.target.value) }))} />
          <Input label="Table Number" type="number" value={form.table_number ? String(form.table_number) : ""} onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value ? Number(e.target.value) : null }))} />
        </div>
        <Input label="Dietary Requirements" value={form.dietary} onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))} placeholder="Allergies, preferences..." />
        {error && <p className="text-sm text-dash-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} loading={saving} disabled={!form.name.trim()}>
            {editingId ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
