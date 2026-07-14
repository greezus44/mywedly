import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Button, Card, Modal, Input, Textarea, EmptyState, LoadingSpinner, Badge } from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  const { data: memberCounts } = useQuery({
    queryKey: ["group-member-counts", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("group_id")
        .in("group_id", (groups ?? []).map((g) => g.id));
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((m: { group_id: string }) => {
        counts[m.group_id] = (counts[m.group_id] ?? 0) + 1;
      });
      return counts;
    },
    enabled: (groups ?? []).length > 0,
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  }

  function openEdit(group: GuestGroup) {
    setEditing(group);
    setForm({ name: group.name, description: group.description ?? "" });
    setShowModal(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name: form.name.trim(), description: form.description || null })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_groups")
          .insert({ event_id: eventId, name: form.name.trim(), description: form.description || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups", eventId] }),
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Groups</h2>
        <Button size="sm" onClick={openCreate}>New group</Button>
      </div>

      <p className="text-sm text-dash-muted">
        Groups let you control which guests are invited to specific events in your wedding schedule.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !groups || groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups to organise your guest list."
          action={<Button size="sm" onClick={openCreate}>Create first group</Button>}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{group.name}</h3>
                    <Badge variant="default">{memberCounts?.[group.id] ?? 0} members</Badge>
                  </div>
                  {group.description && (
                    <p className="text-sm text-dash-muted mt-0.5">{group.description}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(group)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(group.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Group" : "Create Group"}
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Bride's Family"
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional description"
            rows={2}
          />
          {saveMutation.isError && (
            <p className="text-sm text-red-500">{(saveMutation.error as Error)?.message}</p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!form.name.trim()} onClick={() => saveMutation.mutate()}>
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
