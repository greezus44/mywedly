import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Modal, Card, EmptyState, Badge } from "../../components/ui";
import { Users, Plus, Trash2, AlertCircle } from "lucide-react";

export default function GroupsEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: groups, isLoading } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .insert({
          event_id: event.id,
          name: newName,
          sort_order: (groups?.length || 0),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", event.id] });
      setShowCreate(false);
      setNewName("");
      setError(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("row-level security")) {
        setError("You don't have permission to create groups for this event. Please sign in again.");
      } else if (msg.includes("JWT") || msg.includes("token")) {
        setError("Your session has expired. Please sign in again.");
      } else if (msg.includes("wedding_id")) {
        setError("This group couldn't be created because no event is currently selected.");
      } else {
        setError("Unable to create the group: " + msg);
      }
      console.error("Guest group creation error:", err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups", event.id] }),
    onError: (err: any) => alert("Failed to delete group: " + (err.message || "Unknown error")),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Guest Groups</h2>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Group</Button>
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-dash-muted">Loading...</div>
      ) : !groups || groups.length === 0 ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="No groups yet" description="Create groups to organize your guests." action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Group</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-dash-text">{group.name}</h3>
                  <Badge>&nbsp;</Badge>
                </div>
                <button onClick={() => { if (confirm("Delete this group?")) deleteMutation.mutate(group.id); }} className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(null); }} title="New Guest Group">
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <Input placeholder="Group name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newName.trim()} className="w-full">Create Group</Button>
        </div>
      </Modal>
    </div>
  );
}
