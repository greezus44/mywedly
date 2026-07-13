import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry, type GuestbookStatus } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Search, Check, X, Trash2, MessageSquare } from "lucide-react";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [messages, setMessages] = useState<GuestbookEntry[]>([]);
  const [filter, setFilter] = useState<"all" | GuestbookStatus>("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  const { data: msgData, refetch } = useQuery({
    queryKey: ["guestbook", wed?.id],
    enabled: !!wed,
    queryFn: async () => {
      const { data, error } = await supabase.from("guestbook").select("*").eq("wedding_id", wed!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as GuestbookEntry[];
    },
  });

  useEffect(() => { if (wed) setWedding(wed); }, [wed]);
  useEffect(() => { if (msgData) setMessages(msgData); }, [msgData]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GuestbookStatus }) => {
      const { error } = await supabase.from("guestbook").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: ["guestbook", wed?.id] }); setToast({ message: "Message updated", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { refetch(); queryClient.invalidateQueries({ queryKey: ["guestbook", wed?.id] }); setToast({ message: "Message deleted", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const filtered = messages.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    const q = search.toLowerCase();
    return m.author_name.toLowerCase().includes(q) || m.message.toLowerCase().includes(q);
  });

  const counts = {
    all: messages.length,
    pending: messages.filter((m) => m.status === "pending").length,
    approved: messages.filter((m) => m.status === "approved").length,
    rejected: messages.filter((m) => m.status === "rejected").length,
  };

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  const tabs: { key: "all" | GuestbookStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Guestbook</h2>
          <p className="text-sm text-gray-500">Review and moderate guest messages.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${filter === t.key ? "border-gray-900 bg-gray-100 text-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              {t.label} <span className="ml-1 text-xs text-gray-500">({t.count})</span>
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-10 w-64" placeholder="Search messages…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card><EmptyState icon={<MessageSquare className="h-10 w-10" />} title="No messages" description={search ? "Try a different search." : "Guest messages will appear here."} /></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{m.author_name}</span>
                      <Badge variant={m.status === "approved" ? "success" : m.status === "rejected" ? "error" : "warning"}>{m.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{m.message}</p>
                    <p className="mt-2 text-xs text-gray-400">{formatDate(m.created_at)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {m.status !== "approved" && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: m.id, status: "approved" })} title="Approve">
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {m.status !== "rejected" && (
                      <Button variant="ghost" size="sm" onClick={() => updateStatusMutation.mutate({ id: m.id, status: "rejected" })} title="Unapprove / Reject">
                        <X className="h-4 w-4 text-yellow-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this message?")) deleteMutation.mutate(m.id); }} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
