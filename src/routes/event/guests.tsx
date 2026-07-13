import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { generateUsername, cn } from "../../lib/utils";

const SIDES = ["", "Bride", "Groom", "Family", "Friend", "Other"];

interface GuestForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string | null;
  group_name: string;
  side: string;
  plus_ones: number;
}

const EMPTY_FORM: GuestForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  group_id: null,
  group_name: "",
  side: "",
  plus_ones: 0,
};

export default function Guests() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const { data: guests, isLoading, isError, refetch } = useQuery({
    queryKey: ["guests", event.id],
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
    queryKey: ["groups", event.id],
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
    const m = new Map<string, string>();
    groups?.forEach((g) => m.set(g.id, g.name));
    return m;
  }, [groups]);

  const filtered = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      const matchSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (g.username ?? "").toLowerCase().includes(search.toLowerCase());
      const matchGroup = !filterGroup || g.group_id === filterGroup;
      return matchSearch && matchGroup;
    });
  }, [guests, search, filterGroup]);

  const grouped = useMemo(() => {
    const m = new Map<string, EventGuest[]>();
    filtered.forEach((g) => {
      const key = g.group_id ? groupMap.get(g.group_id) ?? "Unknown" : "Ungrouped";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(g);
    });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, groupMap]);

  const validateUsername = async (username: string, excludeId?: string): Promise<boolean> => {
    if (!username) return true;
    const { data } = await supabase
      .from("event_guests")
      .select("id")
      .eq("event_id", event.id)
      .eq("username", username)
      .neq("id", excludeId ?? "")
      .maybeSingle();
    return !data;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_guests").insert({
        event_id: event.id,
        name: form.name,
        username: form.username || generateUsername(form.name),
        email: form.email || null,
        phone: form.phone || null,
        group_id: form.group_id || null,
        group_name: form.group_name || null,
        side: form.side || null,
        plus_ones: form.plus_ones,
        rsvp_status: "pending",
        token: crypto.randomUUID(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: form.name,
          username: form.username || null,
          email: form.email || null,
          phone: form.phone || null,
          group_id: form.group_id || null,
          group_name: form.group_name || null,
          side: form.side || null,
          plus_ones: form.plus_ones,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setUsernameError(null);
    setShowModal(true);
  };

  const openEdit = (g: EventGuest) => {
    setEditing(g);
    setForm({
      name: g.name,
      username: g.username ?? "",
      email: g.email ?? "",
      phone: g.phone ?? "",
      group_id: g.group_id ?? null,
      group_name: g.group_name ?? "",
      side: g.side ?? "",
      plus_ones: g.plus_ones,
    });
    setUsernameError(null);
    setShowModal(true);
  };

  const update = (patch: Partial<GuestForm>) => setForm({ ...form, ...patch });

  const handleUsernameBlur = async () => {
    if (!form.username) {
      setUsernameError(null);
      return;
    }
    const valid = await validateUsername(form.username, editing?.id);
    setUsernameError(valid ? null : "Username already taken in this event");
  };

  const handleSubmit = async () => {
    if (form.username) {
      const valid = await validateUsername(form.username, editing?.id);
      if (!valid) {
        setUsernameError("Username already taken in this event");
        return;
      }
    }
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">{guests?.length ?? 0} total guests</p>
        </div>
        <Button onClick={openCreate}>+ Add Guest</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : grouped.length === 0 ? (
        <EmptyState
          title={search || filterGroup ? "No matching guests" : "No guests yet"}
          description={search || filterGroup ? "Try adjusting your filters." : "Add guests to your event."}
          action={!search && !filterGroup ? <Button onClick={openCreate}>+ Add Guest</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          {grouped.map(([groupName, groupGuests]) => (
            <div key={groupName}>
              <h3 className="mb-2 text-sm font-semibold text-dash-muted">{groupName}</h3>
              <div className="space-y-2">
                {groupGuests.map((g) => (
                  <Card key={g.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-dash-text">{g.name}</span>
                        {g.side && <Badge>{g.side}</Badge>}
                        <Badge variant={
                          g.rsvp_status === "attending" ? "success" :
                          g.rsvp_status === "declined" ? "danger" : "warning"
                        }>
                          {g.rsvp_status}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-dash-muted">
                        {g.username && <span>@{g.username}</span>}
                        {g.email && <span>{g.email}</span>}
                        {g.plus_ones > 0 && <span>+{g.plus_ones} guests</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(g)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(g.id)}
                        loading={deleteMutation.isPending}
                      >
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

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Guest" : "Add Guest"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim() || !!usernameError}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. John Smith"
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => update({ username: e.target.value })}
            onBlur={handleUsernameBlur}
            error={usernameError ?? undefined}
            placeholder="Auto-generated if left blank"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="guest@example.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+1 234 567 890"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Group"
              value={form.group_id ?? ""}
              onChange={(e) => update({ group_id: e.target.value || null })}
            >
              <option value="">No group</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
            <Select
              label="Side"
              value={form.side}
              onChange={(e) => update({ side: e.target.value })}
            >
              {SIDES.map((s) => (
                <option key={s} value={s}>{s || "None"}</option>
              ))}
            </Select>
          </div>
          <Input
            label="Plus Ones"
            type="number"
            min={0}
            value={form.plus_ones}
            onChange={(e) => update({ plus_ones: parseInt(e.target.value) || 0 })}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message || "Failed"}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
