import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, EmptyState, Skeleton, Modal, Toast, FormField } from "../../components/ui";
import { Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

export default function GroupsPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  const { data: groups, isLoading } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_groups").select("*").eq("wedding_id", eventId).order("name"); if (error) throw error; return data as GuestGroup[]; },
  });

  const createMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("guest_groups").insert({ wedding_id: eventId, name: newGroup.name, sort_order: (groups?.length || 0) }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); setShowAdd(false); setNewGroup({ name: "", description: "" }); setToast("Group created"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("guest_groups").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); setToast("Group deleted"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="font-heading text-2xl text-gray-900">Groups</h2><p className="text-sm text-gray-500 mt-1">Organize guests into groups</p></div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Group</Button>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : !groups || groups.length === 0 ? <EmptyState icon={<Users className="w-12 h-12" />} title="No groups" description="Create groups like 'Bride's Family' or 'Coworkers'." action={<Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Group</Button>} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{groups.map((g) => (
          <Card key={g.id} className="flex items-start justify-between p-5">
            <div><h3 className="font-medium text-gray-900">{g.name}</h3></div>
            <button onClick={() => deleteMutation.mutate(g.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </Card>
        ))}</div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Group">
        <div className="space-y-4">
          <FormField label="Name"><Input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Bride's Family" /></FormField>
          <div className="flex gap-3"><Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newGroup.name}>Add</Button><Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button></div>
        </div>
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
