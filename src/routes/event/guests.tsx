import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type EventGuest,
  type GuestGroup,
  type GuestGroupMember,
} from "../../lib/supabase";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  FormField,
  LoadingSpinner,
  ErrorState,
} from "../../components/ui";
import { cn, generateUsername } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GuestForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string;
  side: string;
  table_number: string;
}

const EMPTY_FORM: GuestForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  group_id: "",
  side: "",
  table_number: "",
};

const SIDE_OPTIONS = ["", "Bride", "Groom", "Both", "Family", "Friend", "Other"];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Guests() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [usernameError, setUsernameError] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const guestsKey = ["event_guests", event.id];
  const groupsKey = ["guest_groups", event.id];
  const membersKey = ["guest_group_members", event.id];

  // ---- Queries ----

  const { data: guests, isLoading, error, refetch } = useQuery({
    queryKey: guestsKey,
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
    queryKey: groupsKey,
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

  const { data: memberships } = useQuery({
    queryKey: membersKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("guest_id, group_id")
        .in(
          "group_id",
          (groups ?? []).map((g) => g.id),
        );
      if (error) throw error;
      return data as GuestGroupMember[];
    },
    enabled: !!(groups && groups.length > 0),
  });

  // ---- Derived data ----

  const groupMap = useMemo(() => {
    const m = new Map<string, GuestGroup>();
    (groups ?? []).forEach((g) => m.set(g.id, g));
    return m;
  }, [groups]);

  // Map guestId -> group_id
  const guestGroupMap = useMemo(() => {
    const m = new Map<string, string>();
    (memberships ?? []).forEach((mem) => m.set(mem.guest_id, mem.group_id));
    return m;
  }, [memberships]);

  // Search + filter
  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (guests ?? []).filter((g) => {
      // Group filter
      if (groupFilter === "none") {
        if (guestGroupMap.has(g.id)) return false;
      } else if (groupFilter !== "all") {
        if (guestGroupMap.get(g.id) !== groupFilter) return false;
      }
      // Search
      if (q) {
        const haystack = [g.name, g.username, g.email, g.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [guests, search, groupFilter, guestGroupMap]);

  // Group filtered guests by their group_id
  const groupedGuests = useMemo(() => {
    const buckets = new Map<string, EventGuest[]>();
    // Ensure groups appear in sorted order
    (groups ?? []).forEach((g) => buckets.set(g.id, []));
    // "No group" bucket
    const noGroupKey = "__no_group__";
    buckets.set(noGroupKey, []);

    filteredGuests.forEach((g) => {
      const gid = guestGroupMap.get(g.id);
      const key = gid ?? noGroupKey;
      const arr = buckets.get(key) ?? [];
      arr.push(g);
      buckets.set(key, arr);
    });

    // Build ordered list: groups in sort order, then "No group" if non-empty
    const result: { key: string; label: string; guests: EventGuest[] }[] = [];
    (groups ?? []).forEach((g) => {
      const arr = buckets.get(g.id) ?? [];
      if (arr.length > 0) result.push({ key: g.id, label: g.name, guests: arr });
    });
    const noGroupArr = buckets.get(noGroupKey) ?? [];
    if (noGroupArr.length > 0) {
      result.push({ key: noGroupKey, label: "No Group", guests: noGroupArr });
    }
    return result;
  }, [filteredGuests, groups, guestGroupMap]);

  // ---- Mutations ----

  const validateUsername = async (username: string): Promise<boolean> => {
    const trimmed = username.trim();
    if (!trimmed) return true; // empty is allowed
    let query = supabase
      .from("event_guests")
      .select("id")
      .eq("event_id", event.id)
      .ilike("username", trimmed);
    if (editing) query = query.neq("id", editing.id);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedUsername = form.username.trim();
      const isUnique = await validateUsername(trimmedUsername);
      if (!isUnique) {
        throw new Error("USERNAME_TAKEN");
      }

      const guestPayload = {
        event_id: event.id,
        name: form.name.trim(),
        username: trimmedUsername || null,
        email: form.email.trim(),
        phone: form.phone.trim(),
        side: form.side,
        table_number: form.table_number.trim() || null,
      };

      let guestId = editing?.id;
      if (editing) {
        const { error } = await supabase
          .from("event_guests")
          .update(guestPayload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("event_guests")
          .insert(guestPayload)
          .select("id")
          .single();
        if (error) throw error;
        guestId = data.id;
      }

      // Sync group membership
      if (guestId) {
        // Remove all existing memberships for this guest
        await supabase.from("guest_group_members").delete().eq("guest_id", guestId);
        // Insert new membership if a group was selected
        if (form.group_id) {
          const { error: memError } = await supabase
            .from("guest_group_members")
            .insert({ guest_id: guestId, group_id: form.group_id });
          if (memError) throw memError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKey });
      queryClient.invalidateQueries({ queryKey: membersKey });
      setShowModal(false);
    },
    onError: (err: Error) => {
      if (err.message === "USERNAME_TAKEN") {
        setUsernameError("This username is already taken. Please choose another.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (guest: EventGuest) => {
      // Remove memberships first
      await supabase.from("guest_group_members").delete().eq("guest_id", guest.id);
      const { error } = await supabase.from("event_guests").delete().eq("id", guest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKey });
      queryClient.invalidateQueries({ queryKey: membersKey });
    },
  });

  // ---- Handlers ----

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setUsernameError("");
    setShowModal(true);
  }

  function openEdit(guest: EventGuest) {
    setEditing(guest);
    setForm({
      name: guest.name,
      username: guest.username ?? "",
      email: guest.email ?? "",
      phone: guest.phone ?? "",
      group_id: guestGroupMap.get(guest.id) ?? "",
      side: guest.side ?? "",
      table_number: guest.table_number ?? "",
    });
    setUsernameError("");
    setShowModal(true);
  }

  function handleGenerateUsername() {
    const existing = (guests ?? [])
      .filter((g) => g.id !== editing?.id)
      .map((g) => g.username ?? "")
      .filter(Boolean);
    const generated = generateUsername(form.name, existing);
    setForm({ ...form, username: generated });
    setUsernameError("");
  }

  function toggleCollapse(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ---- Render ----

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }
  if (error) return <ErrorState message="Failed to load guests." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Guests</h2>
        <Button onClick={openNew}>+ Add Guest</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by name, username, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="sm:max-w-xs"
        >
          <option value="all">All Groups</option>
          <option value="none">No Group</option>
          {(groups ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Guest list grouped by group */}
      {filteredGuests.length === 0 ? (
        <EmptyState
          title={guests && guests.length === 0 ? "No guests yet" : "No guests match your filters"}
          description={
            guests && guests.length === 0
              ? "Add your first guest to start building your guest list."
              : "Try adjusting your search or group filter."
          }
          action={
            guests && guests.length === 0 ? <Button onClick={openNew}>+ Add Guest</Button> : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {groupedGuests.map(({ key, label, guests: groupGuests }) => {
            const collapsed = collapsedGroups.has(key);
            return (
              <Card key={key} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCollapse(key)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-dash-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={cn(
                        "h-4 w-4 text-dash-muted transition-transform",
                        collapsed ? "" : "rotate-90",
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <h3 className="text-sm font-semibold text-dash-text">{label}</h3>
                    <Badge variant="default">{groupGuests.length}</Badge>
                  </div>
                </button>
                {!collapsed && (
                  <div className="border-t border-dash-border">
                    {/* Table header */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-dash-bg/30 text-xs font-medium text-dash-muted">
                      <div className="col-span-3">Name</div>
                      <div className="col-span-2">Username</div>
                      <div className="col-span-3">Contact</div>
                      <div className="col-span-2">RSVP</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                    {groupGuests.map((guest) => (
                      <GuestRow
                        key={guest.id}
                        guest={guest}
                        groupName={label}
                        onEdit={() => openEdit(guest)}
                        onDelete={() => deleteMutation.mutate(guest)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              autoFocus
            />
          </FormField>

          <FormField label="Username" hint="Used for guest login. Must be unique.">
            <div className="flex gap-2">
              <Input
                value={form.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value });
                  setUsernameError("");
                }}
                placeholder="e.g., john.doe"
                error={usernameError}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateUsername}
                disabled={!form.name.trim()}
              >
                Auto
              </Button>
            </div>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Group">
              <Select
                value={form.group_id}
                onChange={(e) => setForm({ ...form, group_id: e.target.value })}
              >
                <option value="">No Group</option>
                {(groups ?? []).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Side">
              <Select
                value={form.side}
                onChange={(e) => setForm({ ...form, side: e.target.value })}
              >
                {SIDE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s || "—"}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Table Number">
              <Input
                value={form.table_number}
                onChange={(e) => setForm({ ...form, table_number: e.target.value })}
                placeholder="e.g., 5"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              loading={saveMutation.isPending}
              disabled={!form.name.trim()}
              onClick={() => saveMutation.mutate()}
            >
              {editing ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GuestRow
// ---------------------------------------------------------------------------

function GuestRow({
  guest,
  groupName,
  onEdit,
  onDelete,
}: {
  guest: EventGuest;
  groupName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rsvpVariant =
    guest.rsvp_status === "accepted"
      ? "success"
      : guest.rsvp_status === "declined"
        ? "danger"
        : "warning";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 px-4 py-3 border-t border-dash-border items-center hover:bg-dash-bg/30 transition-colors">
      <div className="sm:col-span-3">
        <p className="text-sm font-medium text-dash-text">{guest.name}</p>
        <p className="text-xs text-dash-muted sm:hidden">{groupName}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-sm text-dash-text">{guest.username || "—"}</p>
      </div>
      <div className="sm:col-span-3">
        <p className="text-sm text-dash-text truncate">{guest.email || guest.phone || "—"}</p>
      </div>
      <div className="sm:col-span-2">
        <Badge variant={rsvpVariant}>{guest.rsvp_status || "pending"}</Badge>
      </div>
      <div className="sm:col-span-2 flex gap-1 justify-end">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
