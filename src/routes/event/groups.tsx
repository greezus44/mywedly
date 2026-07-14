import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");

  const { data: groups, isLoading, isError, error } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  const { data: groupCounts } = useQuery({
    queryKey: ["group-counts", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("group_id")
        .eq("event_id", eventId)
        .not("group_id", "is", null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const gid = row.group_id as string;
        counts.set(gid, (counts.get(gid) ?? 0) + 1);
      }
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name, updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_groups")
          .insert({
            event_id: eventId,
            name,
            sort_order: (groups?.length ?? 0),
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-counts", eventId] });
      setShowEdit(false);
      setEditing(null);
      setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-counts", eventId] });
    },
  });

  const handleAdd = () => {
    setEditing(null);
    setName("");
    setShowEdit(true);
  };

  const handleEdit = (group: GuestGroup) => {
    setEditing(group);
    setName(group.name);
    setShowEdit(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load groups" description={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Guest Groups</h2>
        <Button onClick={handleAdd}>Add Group</Button>
      </div>

      {groups && groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups to organise your guests (e.g. Family, Friends, Colleagues)."
          action={<Button onClick={handleAdd}>Add Group</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups?.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                  <div className="mt-2">
                    <Badge>
                      {groupCounts?.get(group.id) ?? 0} guests
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(group)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-dash-danger"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete group "${group.name}"?`)) {
                        deleteMutation.mutate(group.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={editing ? "Edit Group" : "Add Group"}
      >
        <div className="space-y-4">
          <Input
            label="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family"
            autoFocus
            required
          />
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!name.trim()}
            >
              {editing ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
