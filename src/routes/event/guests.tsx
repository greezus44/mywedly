import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Input, Select, Modal, LoadingSpinner, ErrorState, EmptyState, Card, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { generateUsername, cn } from "../../lib/utils";

interface GuestForm {
  name: string; username: string; email: string; phone: string;
  group_id: string; side: string; group_name: string;
}

const EMPTY_FORM: GuestForm = { name: "", username: "", email: "", phone: "", group_id: "", side: "", group_name: "" };

export default function Guests() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: guests, isLoading, error: queryError } = useQuery({
    queryKey: ["event_guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", event.id).order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", event.id).order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate username uniqueness (ilike check)
      if (form.username) {
        const query = supabase.from("event_guests").select("id").eq("event_id", event.id).ilike("username", form.username);
        const { data: existing } = editingId ? await query.neq("id", editingId) : await query;
        if (existing && existing.length > 0) throw new Error("Username already taken. Please choose another.");
      }

      const group = groups?.find((g) => g.id === form.group_id);
      const payload = {
        event_id: event.id, name: form.name, username: form.username || null,
        email: form.email, phone: form.phone, group_id: form.group_id || null,
        group_name: group?.name || form.group_name || "", side: form.side,
      };

      if (editingId) {
        const { error } = await supabase.from("event_guests").update(payload).eq("id", editingId).select().maybeSingle();
        if (error) throw error;
        // Update group membership
        await supabase.from("guest_group_members").delete().eq("guest_id", editingId);
        if (form.group_id) {
          await supabase.from("guest_group_members").insert({ guest_id: editingId, group_id: form.group_id });
        }
      } else {
        const { data, error } = await supabase.from("event_guests").insert(payload).select().maybeSingle();
        if (error) throw error;
        if (data && form.group_id) {
          await supabase.from("guest_group_members").insert({ guest_id: data.id, group_id: form.group_id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", event.id] });
      setModalOpen(false); setForm(EMPTY_FORM); setEditingId(null); setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to save guest."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event_guests", event.id] }),
  });

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setError(null); setModalOpen(true); }
  function openEdit(guest: EventGuest) {
    setForm({ name: guest.name, username: guest.username || "", email: guest.email, phone: guest.phone, group_id: guest.group_id || "", side: guest.side, group_name: guest.group_name });
    setEditingId(guest.id); setError(null); setModalOpen(true);
  }

  function handleAutoGenerate() {
    const existing = (guests || []).map((g) => g.username || "");
    setForm({ ...form, username: generateUsername(form.name, existing) });
  }

  // Group guests by group
  const groupedGuests = useMemo(() => {
    const filtered = (guests || []).filter((g) => {
      if (filterGroup !== "all" && g.group_id !== filterGroup) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !(g.email || "").toLowerCase().includes(q) && !(g.username || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const grouped: Record<string, EventGuest[]> = {};
    filtered.forEach((g) => {
      const key = g.group_id || "ungrouped";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(g);
    });
    return grouped;
  }, [guests, filterGroup, search]);

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (queryError) return <ErrorState message="Failed to load guests." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage your guest list and group assignments.</p>
        </div>
        <Button onClick={openAdd}>Add Guest</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search by name, email, or username..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className="sm:w-56">
          <option value="all">All Groups</option>
          {(groups || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </div>

      {/* Guest list grouped */}
      {Object.keys(groupedGuests).length === 0 ? (
        <EmptyState title="No guests found" description={search || filterGroup !== "all" ? "Try adjusting your filters." : "Add guests to your list to get started."} action={!search && filterGroup === "all" ? <Button onClick={openAdd}>Add Guest</Button> : undefined} />
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedGuests).map(([groupKey, groupGuests]) => {
            const groupName = groupKey === "ungrouped" ? "Ungrouped" : groups?.find((g) => g.id === groupKey)?.name || "Unknown";
            const isExpanded = expandedGroups.has(groupKey) || groupKey === "ungrouped";
            return (
              <Card key={groupKey} className="overflow-hidden p-0">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{isExpanded ? "▼" : "▶"}</span>
                    <h3 className="font-semibold text-dash-text">{groupName}</h3>
                    <Badge>{groupGuests.length} guest{groupGuests.length !== 1 ? "s" : ""}</Badge>
                  </div>
                </button>
                {isExpanded && (
                  <div className="divide-y divide-dash-border border-t border-dash-border">
                    {groupGuests.map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-dash-text">{guest.name}</span>
                            {guest.username && <Badge variant="info">@{guest.username}</Badge>}
                            {guest.rsvp_status && <Badge variant={guest.rsvp_status === "attending" ? "success" : guest.rsvp_status === "not_attending" ? "danger" : "default"}>{guest.rsvp_status}</Badge>}
                          </div>
                          <div className="mt-1 flex gap-4 text-xs text-dash-muted">
                            {guest.email && <span>{guest.email}</span>}
                            {guest.phone && <span>{guest.phone}</span>}
                            {guest.side && <span className="capitalize">{guest.side}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(guest)}>Edit</Button>
                          <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(guest.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(null); }} title={editingId ? "Edit Guest" : "Add Guest"} size="lg">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Guest full name" autoFocus />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Auto-generated if empty" />
            </div>
            <Button variant="secondary" onClick={handleAutoGenerate} disabled={!form.name.trim()}>Auto-generate</Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="guest@example.com" />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            <Select label="Group" value={form.group_id} onChange={(e) => setForm({ ...form, group_id: e.target.value })}>
              <option value="">No group</option>
              {(groups || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
            <Select label="Side" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
              <option value="">None</option>
              <option value="bride">Bride's side</option>
              <option value="groom">Groom's side</option>
              <option value="both">Both</option>
              <option value="other">Other</option>
            </Select>
          </div>
          {error && <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setError(null); }}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!form.name.trim()} onClick={() => saveMutation.mutate()}>{editingId ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
