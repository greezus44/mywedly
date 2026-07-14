import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select, Modal, Card, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { cn, generateUsername } from "../../lib/utils";
import {
  GuestFormFieldsComponent,
  RsvpBadge,
  guestToForm,
  EMPTY_GUEST_FORM,
  type GuestFormFields,
} from "./guest-form";

interface GuestDB {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  side: string | null;
  group_id: string | null;
  group_name: string | null;
  guest_count: number | null;
  plus_one_allowed: boolean | null;
  dietary_notes: string | null;
  table_number: string | null;
  rsvp_status: string | null;
  created_at: string;
  updated_at: string;
}

interface GroupDB {
  id: string;
  event_id: string;
  name: string;
}

interface SubEventDB {
  id: string;
  parent_event_id: string;
  name: string;
}

interface OverrideDB {
  id: string;
  guest_id: string;
  sub_event_id: string;
  is_invited: boolean;
}

export default function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormFields>(EMPTY_GUEST_FORM);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSide, setFilterSide] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Fetch guests
  const { data: guests, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as GuestDB[];
    },
  });

  // Fetch groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as GroupDB[];
    },
  });

  // Fetch sub-events
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEventDB[];
    },
  });

  // Fetch all overrides for this event's guests
  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides-event", eventId],
    queryFn: async () => {
      if (!guests || guests.length === 0) return [];
      const guestIds = guests.map((g) => g.id);
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in("guest_id", guestIds);
      if (error) throw error;
      return data as OverrideDB[];
    },
    enabled: !!guests && guests.length > 0,
  });

  // ─── Mutations ──────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: eventId,
        name: form.name,
        email: form.email || "",
        phone: form.phone || "",
        username: form.username || null,
        side: form.side || "",
        group_id: form.group_id || null,
        group_name: form.group_name || "",
        guest_count: parseInt(form.guest_count, 10) || 1,
        plus_one_allowed: form.plus_one_allowed,
        dietary_notes: form.dietary_notes || "",
        table_number: form.table_number || null,
      };
      if (editingId) {
        const { error } = await supabase.from("event_guests").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_guests").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides-event", eventId] });
      setModalOpen(false);
      setForm(EMPTY_GUEST_FORM);
      setEditingId(null);
      setUsernameError(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides-event", eventId] });
    },
  });

  const toggleOverride = useMutation({
    mutationFn: async ({ guestId, subEventId, isInvited }: { guestId: string; subEventId: string; isInvited: boolean }) => {
      // Check if override exists
      const existing = (overrides ?? []).find(
        (o) => o.guest_id === guestId && o.sub_event_id === subEventId
      );
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guest_invitation_overrides").insert({
          guest_id: guestId,
          sub_event_id: subEventId,
          is_invited: isInvited,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides-event", eventId] });
    },
  });

  // ─── Derived data ───────────────────────────────────────────────────────

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          g.name.toLowerCase().includes(q) ||
          (g.email ?? "").toLowerCase().includes(q) ||
          (g.username ?? "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filterSide && g.side !== filterSide) return false;
      if (filterGroup && g.group_id !== filterGroup) return false;
      return true;
    });
  }, [guests, search, filterSide, filterGroup]);

  // Group guests by group_id (ungrouped go to "__none__")
  const groupedGuests = useMemo(() => {
    const map = new Map<string, GuestDB[]>();
    for (const g of filteredGuests) {
      const key = g.group_id || "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return map;
  }, [filteredGuests]);

  const groupNames = useMemo(() => {
    const map = new Map<string, string>();
    map.set("__none__", "Ungrouped");
    for (const g of groups ?? []) map.set(g.id, g.name);
    return map;
  }, [groups]);

  // Determine if a guest is invited to a sub-event
  function isInvitedTo(guestId: string, subEventId: string): boolean {
    const override = (overrides ?? []).find(
      (o) => o.guest_id === guestId && o.sub_event_id === subEventId
    );
    return override ? override.is_invited : false;
  }

  // ─── Handlers ───────────────────────────────────────────────────────────

  function openCreate() {
    setForm(EMPTY_GUEST_FORM);
    setEditingId(null);
    setUsernameError(null);
    setModalOpen(true);
  }

  function openEdit(guest: GuestDB) {
    setForm(guestToForm(guest as unknown as EventGuest));
    setEditingId(guest.id);
    setUsernameError(null);
    setModalOpen(true);
  }

  async function checkUsernameUnique(username: string, excludeId?: string): Promise<boolean> {
    if (!username) return true;
    const { data, error } = await supabase
      .from("event_guests")
      .select("id")
      .eq("event_id", eventId)
      .eq("username", username);
    if (error) return true;
    if (!data || data.length === 0) return true;
    if (excludeId && data.length === 1 && data[0].id === excludeId) return true;
    return false;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Auto-generate username if blank
    let finalForm = { ...form };
    if (!finalForm.username && finalForm.name) {
      finalForm.username = generateUsername(finalForm.name);
      setForm(finalForm);
    }
    // Validate username uniqueness
    if (finalForm.username) {
      const unique = await checkUsernameUnique(finalForm.username, editingId ?? undefined);
      if (!unique) {
        setUsernameError("Username already taken. Please choose another.");
        return;
      }
    }
    setUsernameError(null);
    saveMutation.mutate();
  }

  function toggleGroupCollapse(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const totalGuests = guests?.length ?? 0;
  const totalFiltered = filteredGuests.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted">
            {totalGuests} {totalGuests === 1 ? "guest" : "guests"} total
            {totalFiltered !== totalGuests && ` (${totalFiltered} shown)`}
          </p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error: {saveMutation.error?.message}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or username..."
          className="flex-1"
        />
        <Select
          value={filterSide}
          onChange={(e) => setFilterSide(e.target.value)}
          className="sm:w-40"
        >
          <option value="">All sides</option>
          <option value="Bride">Bride</option>
          <option value="Groom">Groom</option>
          <option value="Family">Family</option>
          <option value="Friend">Friend</option>
          <option value="Other">Other</option>
        </Select>
        <Select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="sm:w-40"
        >
          <option value="">All groups</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Guest list grouped */}
      {totalFiltered === 0 ? (
        <EmptyState
          title={totalGuests === 0 ? "No guests yet" : "No guests match your filters"}
          description={
            totalGuests === 0
              ? "Add guests to your event to manage invitations and RSVPs."
              : "Try adjusting your search or filters."
          }
          icon={<span className="text-5xl">👥</span>}
          action={totalGuests === 0 ? <Button onClick={openCreate}>Add Guest</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {Array.from(groupedGuests.entries()).map(([groupKey, groupGuests]) => {
            const isCollapsed = collapsedGroups.has(groupKey);
            return (
              <div key={groupKey} className="rounded-lg border border-dash-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(groupKey)}
                  className="flex w-full items-center justify-between bg-dash-surface px-4 py-3 hover:bg-dash-bg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-dash-text">
                      {groupNames.get(groupKey) ?? "Unknown Group"}
                    </span>
                    <Badge variant="default">{groupGuests.length}</Badge>
                  </div>
                  <span className="text-xs text-dash-muted">{isCollapsed ? "▼" : "▲"}</span>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-dash-border">
                    {groupGuests.map((guest) => (
                      <GuestRow
                        key={guest.id}
                        guest={guest}
                        subEvents={subEvents ?? []}
                        isInvitedTo={isInvitedTo}
                        onToggleOverride={(subEventId, isInvited) =>
                          toggleOverride.mutate({ guestId: guest.id, subEventId, isInvited })
                        }
                        onEdit={() => openEdit(guest)}
                        onDelete={() => deleteMutation.mutate(guest.id)}
                        toggling={toggleOverride.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <GuestFormFieldsComponent
            form={form}
            setForm={setForm}
            groups={groups ?? []}
            usernameError={usernameError}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Guest row component ──────────────────────────────────────────────────

interface GuestRowProps {
  guest: GuestDB;
  subEvents: SubEventDB[];
  isInvitedTo: (guestId: string, subEventId: string) => boolean;
  onToggleOverride: (subEventId: string, isInvited: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  toggling: boolean;
}

function GuestRow({
  guest,
  subEvents,
  isInvitedTo,
  onToggleOverride,
  onEdit,
  onDelete,
  toggling,
}: GuestRowProps) {
  return (
    <div className="bg-dash-bg px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-dash-text">{guest.name}</h4>
            <RsvpBadge status={guest.rsvp_status} />
            {guest.side && <Badge variant="default">{guest.side}</Badge>}
            {guest.guest_count && guest.guest_count > 1 && (
              <Badge variant="default">{guest.guest_count} guests</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-dash-muted">
            {guest.email && <span>✉ {guest.email}</span>}
            {guest.phone && <span>☎ {guest.phone}</span>}
            {guest.username && <span>@{guest.username}</span>}
            {guest.table_number && <span>🪑 {guest.table_number}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Invited events chips */}
      {subEvents.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium text-dash-muted">Invited to:</p>
          <div className="flex flex-wrap gap-2">
            {subEvents.map((se) => {
              const invited = isInvitedTo(guest.id, se.id);
              return (
                <button
                  key={se.id}
                  type="button"
                  disabled={toggling}
                  onClick={() => onToggleOverride(se.id, !invited)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                    invited
                      ? "border-dash-primary/30 bg-dash-primary/10 text-dash-primary"
                      : "border-dash-border bg-dash-surface text-dash-muted hover:bg-dash-bg"
                  )}
                >
                  {invited ? "✓ " : ""}
                  {se.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
