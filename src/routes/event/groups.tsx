import React, { useState } from "react";
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

async function fetchGroups(eventId: string): Promise<GuestGroup[]> {
  const { data, error } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GuestGroup[];
}

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const { data: groups, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: () => fetchGroups(eventId),
  });

  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEditing(null);
    setSaveError(null);
  };

  const openCreate = () => {
    resetForm();
    setShowEdit(true);
  };

  const openEdit = (group: GuestGroup) => {
    setEditing(group);
    setName(group.name);
    setSaveError(null);
    setShowEdit(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Group name is required");
      if (editing) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name: name.trim(), updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const maxSort = groups?.reduce((max, g) => Math.max(max, g.sort_order), 0) ?? 0;
        const { error } = await supabase
          .from("guest_groups")
          .insert({
            event_id: eventId,
            name: name.trim(),
            sort_order: maxSort + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowEdit(false);
      resetForm();
    },
    onError: (err: Error) => {
      setSaveError(err.message);
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
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load groups"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Guest Groups</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Organise guests into groups for easier management
          </p>
        </div>
        <Button onClick={openCreate}>Add Group</Button>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">👥</span>}
          title="No groups yet"
          description="Create groups to organise your guests (e.g. Bride's family, Groom's friends)."
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                <p className="mt-1 text-xs text-dash-muted">
                  Sort order: {group.sort_order}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(group)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"?`)) {
                      deleteMutation.mutate(group.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={editing ? "Edit Group" : "Add Group"}
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bride's Family"
            required
          />
          {saveError && <p className="text-sm text-dash-danger">{saveError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!name.trim()}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
