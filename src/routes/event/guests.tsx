import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select, Modal, Card, EmptyState, Badge, FormField } from "../../components/ui";
import { UserPlus, Search, Trash2, ChevronDown, ChevronUp, Users, RefreshCw, AlertCircle } from "lucide-react";

export default function GuestsEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", group_id: "" });
  const [error, setError] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", event.id],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", event.id).order("created_at", { ascending: false }); if (error) throw error; return data as EventGuest[]; },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", event.id],
    queryFn: async () => { const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", event.id).order("sort_order", { ascending: true }); if (error) throw error; return data as GuestGroup[]; },
  });

  const { data: groupMembers } = useQuery({
    queryKey: ["group-members", event.id],
    queryFn: async () => {
      const guestIds = (guests || []).map((g) => g.id);
      if (guestIds.length === 0) return [];
      const { data, error } = await supabase.from("guest_group_members").select("*").in("guest_id", guestIds);
      if (error) throw error;
      return data as { guest_id: string; group_id: string }[];
    },
    enabled: !!guests?.length,
  });

  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (groups || []).forEach((g) => map.set(g.id, g.name));
    return map;
  }, [groups]);

  const guestToGroup = useMemo(() => {
    const map = new Map<string, string>();
    (groupMembers || []).forEach((gm) => map.set(gm.guest_id, gm.group_id));
    return map;
  }, [groupMembers]);

  const filtered = useMemo(() => {
    let result = guests || [];
    if (filterGroupId !== "all") {
      if (filterGroupId === "none") {
        result = result.filter((g) => !guestToGroup.has(g.id));
      } else {
        result = result.filter((g) => guestToGroup.get(g.id) === filterGroupId);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((g) =>
        g.name.toLowerCase().includes(q) ||
        (g.username || "").toLowerCase().includes(q) ||
        (g.email || "").toLowerCase().includes(q) ||
        (g.phone || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [guests, filterGroupId, search, guestToGroup]);

  const grouped = useMemo(() => {
    const groupsMap = new Map<string, EventGuest[]>();
    (groups || []).forEach((g) => groupsMap.set(g.id, []));
    groupsMap.set("none", []);
    filtered.forEach((g) => {
      const gid = guestToGroup.get(g.id) || "none";
      if (!groupsMap.has(gid)) groupsMap.set(gid, []);
      groupsMap.get(gid)!.push(g);
    });
    return groupsMap;
  }, [filtered, groups, guestToGroup]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmedUsername = form.username.trim();
      if (trimmedUsername) {
        const { data: existing } = await supabase.from("event_guests").select("id").eq("event_id", event.id).ilike("username", trimmedUsername).maybeSingle();
        if (existing) throw new Error("Username already exists in this event. Please choose a different username.");
      }
      const { error } = await supabase.from("event_guests").insert({
        event_id: event.id, name: form.name, username: trimmedUsername || null,
        email: form.email, phone: form.phone,
      });
      if (error) throw error;
      if (form.group_id) {
        const { data: newGuest } = await supabase.from("event_guests").select("id").eq("event_id", event.id).eq("name", form.name).order("created_at", { ascending: false }).limit(1).single();
        if (newGuest) {
          await supabase.from("guest_group_members").insert({ guest_id: newGuest.id, group_id: form.group_id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", event.id] });
      setShowModal(false);
      setForm({ name: "", username: "", email: "", phone: "", group_id: "" });
      setError(null);
    },
    onError: (err: any) => setError(err.message || "Failed to add guest"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingGuest) return;
      const trimmedUsername = form.username.trim();
      if (trimmedUsername) {
        const { data: existing } = await supabase.from("event_guests").select("id").eq("event_id", event.id).ilike("username", trimmedUsername).neq("id", editingGuest.id).maybeSingle();
        if (existing) throw new Error("Username already exists in this event. Please choose a different username.");
      }
      const { error } = await supabase.from("event_guests").update({
        name: form.name, username: trimmedUsername || null,
        email: form.email, phone: form.phone,
      }).eq("id", editingGuest.id);
      if (error) throw error;

      const currentGroupId = guestToGroup.get(editingGuest.id);
      if (currentGroupId !== form.group_id) {
        if (currentGroupId) {
          await supabase.from("guest_group_members").delete().eq("guest_id", editingGuest.id).eq("group_id", currentGroupId);
        }
        if (form.group_id) {
          await supabase.from("guest_group_members").insert({ guest_id: editingGuest.id, group_id: form.group_id });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", event.id] });
      setShowModal(false);
      setEditingGuest(null);
      setForm({ name: "", username: "", email: "", phone: "", group_id: "" });
      setError(null);
    },
    onError: (err: any) => setError(err.message || "Failed to update guest"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("guest_group_members").delete().eq("guest_id", id);
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", event.id] });
    },
    onError: (err: any) => alert("Failed to delete: " + (err.message || "Unknown error")),
  });

  const generateUsername = (name: string) => {
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]/g, ".");
    let username = base;
    let suffix = 1;
    const existingUsernames = new Set((guests || []).filter((g) => g.id !== editingGuest?.id).map((g) => (g.username || "").toLowerCase()));
    while (existingUsernames.has(username.toLowerCase())) {
      username = `${base}${suffix}`;
      suffix++;
    }
    return username;
  };

  const openCreate = () => { setEditingGuest(null); setForm({ name: "", username: "", email: "", phone: "", group_id: "" }); setError(null); setShowModal(true); };
  const openEdit = (guest: EventGuest) => {
    setEditingGuest(guest);
    setForm({ name: guest.name, username: guest.username || "", email: guest.email || "", phone: guest.phone || "", group_id: guestToGroup.get(guest.id) || "" });
    setError(null);
    setShowModal(true);
  };
  const handleSubmit = () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (editingGuest) updateMutation.mutate();
    else createMutation.mutate();
  };

  const groupEntries = Array.from(grouped.entries());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Guests</h2>
        <Button onClick={openCreate}><UserPlus className="w-4 h-4" /> Add Guest</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dash-muted" />
          <Input placeholder="Search guests..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterGroupId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterGroupId(e.target.value)} className="sm:w-48">
          <option value="all">All Groups</option>
          <option value="none">No Group</option>
          {(groups || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-dash-muted">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="No guests found" description="Add guests or adjust your search/filter." />
      ) : (
        <div className="space-y-3">
          {groupEntries.map(([groupId, groupGuests]) => {
            if (groupGuests.length === 0) return null;
            const isCollapsed = collapsedGroups.has(groupId);
            const groupName = groupId === "none" ? "No Group" : groupNameMap.get(groupId) || "Unknown";
            return (
              <Card key={groupId} className="overflow-hidden">
                <button onClick={() => toggleGroup(groupId)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronDown className="w-4 h-4 text-dash-muted" /> : <ChevronUp className="w-4 h-4 text-dash-muted" />}
                    <span className="font-medium text-dash-text">{groupName}</span>
                    <Badge>{groupGuests.length}</Badge>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-dash-border">
                    {groupGuests.map((g) => (
                      <div key={g.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-dash-text">{g.name}</span>
                            {g.username && <Badge variant="info">@{g.username}</Badge>}
                          </div>
                          <p className="text-sm text-dash-muted">{g.email || g.phone || ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={g.rsvp_status === "attending" ? "success" : g.rsvp_status === "declined" ? "danger" : "default"}>{g.rsvp_status}</Badge>
                          <button onClick={() => openEdit(g)} className="text-sm text-dash-primary hover:underline">Edit</button>
                          <button onClick={() => { if (confirm("Remove this guest?")) deleteMutation.mutate(g.id); }} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
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

      <Modal open={showModal} onClose={() => { setShowModal(false); setError(null); }} title={editingGuest ? "Edit Guest" : "Add Guest"}>
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <FormField label="Name"><Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Username" hint="Unique identifier for guest sign-in. Case-insensitive.">
            <div className="flex gap-2">
              <Input value={form.username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, username: e.target.value })} placeholder="e.g. john.tan" />
              <Button variant="secondary" size="sm" onClick={() => setForm({ ...form, username: generateUsername(form.name) })} disabled={!form.name.trim()}>
                <RefreshCw className="w-3 h-3" /> Auto
              </Button>
            </div>
          </FormField>
          <FormField label="Email"><Input type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} /></FormField>
          <FormField label="Phone"><Input value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Group">
            <Select value={form.group_id} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, group_id: e.target.value })}>
              <option value="">No Group</option>
              {(groups || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </FormField>
          <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending} disabled={!form.name.trim()} className="w-full">{editingGuest ? "Save Changes" : "Add Guest"}</Button>
        </div>
      </Modal>
    </div>
  );
}
