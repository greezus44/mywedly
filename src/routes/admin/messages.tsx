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
  const [toast, setToast] = useState<string | null>(null);
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
    queryKey: ["guestbook", tab],
    queryFn: async () => {
      if (!wedding) return [];
      let query = supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (tab === "pending") query = query.eq("status", "pending");
      else if (tab === "approved") query = query.eq("status", "approved");
      const { data } = await query;
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const { data: counts } = useQuery({
    queryKey: ["guestbook-counts"],
    queryFn: async () => {
      if (!wedding) return { all: 0, pending: 0, approved: 0 };
      const { count: all } = await supabase.from("guestbook_entries").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id);
      const { count: pending } = await supabase.from("guestbook_entries").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id).eq("status", "pending");
      const { count: approved } = await supabase.from("guestbook_entries").select("*", { count: "exact", head: true }).eq("wedding_id", wedding.id).eq("status", "approved");
      return { all: all || 0, pending: pending || 0, approved: approved || 0 };
    },
    enabled: !!wedding,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ status: "approved" as GuestbookStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guestbook"] });
      qc.invalidateQueries({ queryKey: ["guestbook-counts"] });
      setToast("Message approved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const unapproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ status: "pending" as GuestbookStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guestbook"] });
      qc.invalidateQueries({ queryKey: ["guestbook-counts"] });
      setToast("Message unapproved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guestbook"] });
      qc.invalidateQueries({ queryKey: ["guestbook-counts"] });
      setToast("Message deleted");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts?.all || 0 },
    { id: "pending", label: "Pending", count: counts?.pending || 0 },
    { id: "approved", label: "Approved", count: counts?.approved || 0 },
  ];

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Guestbook Messages</h2>
        <p className="mt-1 text-sm text-gray-500">Review and approve messages from your guests.</p>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${tab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
            <Badge variant={t.id === "pending" && t.count > 0 ? "warning" : "default"}>{t.count}</Badge>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card><div className="py-8 text-center text-gray-500">Loading messages...</div></Card>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => (
            <Card key={msg.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{msg.author_name}</span>
                    <Badge variant={msg.status === "approved" ? "success" : msg.status === "pending" ? "warning" : "error"}>
                      {msg.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{msg.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{formatDate(msg.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {msg.status === "approved" ? (
                    <Button size="sm" variant="outline" onClick={() => unapproveMutation.mutate(msg.id)}>
                      <X className="h-4 w-4" /> Unapprove
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(msg.id)}>
                      <Check className="h-4 w-4 text-green-600" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(msg.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState icon={<MessageSquare className="h-10 w-10" />} title="No messages" description="Guest messages will appear here once submitted." />
          </Card>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
