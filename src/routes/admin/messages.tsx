import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry, type GuestbookStatus } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Check, X, Trash2, MessageSquare } from "lucide-react";

type FilterTab = "all" | "pending" | "approved";

export function MessagesPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      return data as Wedding | null;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["guestbook", wedding?.id, tab],
    queryFn: async () => {
      if (!wedding) return [];
      let q = supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (tab === "pending") q = q.eq("status", "pending");
      else if (tab === "approved") q = q.eq("status", "approved");
      const { data } = await q;
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GuestbookStatus }) => {
      const { error } = await supabase.from("guestbook_entries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guestbook"] }),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guestbook"] }),
  });

  const tabs: { id: FilterTab; label: string }[] = [{ id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "approved", label: "Approved" }];

  return (
    <AdminLayout>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Guestbook Messages</h2>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${tab === t.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      {messages && messages.length === 0 && !isLoading && (
        <Card><EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No messages found" /></Card>
      )}

      <div className="space-y-3">
        {messages?.map((m) => (
          <Card key={m.id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{m.author_name}</p>
                <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
              </div>
              <Badge variant={m.status === "approved" ? "success" : m.status === "rejected" ? "error" : "warning"}>{m.status}</Badge>
            </div>
            <p className="text-sm text-gray-700">{m.message}</p>
            <div className="flex gap-2 pt-2">
              {m.status !== "approved" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: m.id, status: "approved" })}><Check className="mr-1 h-3 w-3" /> Approve</Button>
              )}
              {m.status === "approved" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: m.id, status: "pending" })}><X className="mr-1 h-3 w-3" /> Unapprove</Button>
              )}
              <Button size="sm" variant="danger" onClick={() => deleteMessage.mutate(m.id)}><Trash2 className="mr-1 h-3 w-3" /> Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
