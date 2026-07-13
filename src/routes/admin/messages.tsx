import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry, type GuestbookStatus } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, EmptyState } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Search, Check, X, Trash2, MessageSquare } from "lucide-react";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | GuestbookStatus>("all");
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["guestbook", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestbook", wedding?.id] });
      setToast("Message approved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const unapproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ status: "pending" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestbook", wedding?.id] });
      setToast("Message unapproved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestbook", wedding?.id] });
      setToast("Message rejected");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestbook", wedding?.id] });
      setToast("Message deleted");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const filteredMessages = (messages || []).filter((m) => {
    const matchesSearch = !search || m.author_name.toLowerCase().includes(search.toLowerCase()) || m.message.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || m.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = (messages || []).filter((m) => m.status === "pending").length;
  const approvedCount = (messages || []).filter((m) => m.status === "approved").length;
  const rejectedCount = (messages || []).filter((m) => m.status === "rejected").length;

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading guestbook...</div>
        </div>
      </AdminLayout>
    );
  }

  const filterTabs: { key: "all" | GuestbookStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: messages?.length || 0 },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guestbook</h1>
          <p className="mt-1 text-sm text-gray-500">Review and moderate messages from your guests.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                filter === tab.key
                  ? "border-gray-900 bg-gray-100 text-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="pl-10"
          />
        </div>

        {/* Messages */}
        {isLoading ? (
          <div className="text-gray-500">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <Card>
            <EmptyState icon={<MessageSquare className="h-8 w-8" />} title={search ? "No messages found" : "No messages yet"} description={search ? "Try a different search." : "Guestbook messages will appear here."} />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <Card key={msg.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{msg.author_name}</h3>
                      <Badge variant={msg.status === "approved" ? "success" : msg.status === "rejected" ? "error" : "warning"}>
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{msg.message}</p>
                    <p className="mt-2 text-xs text-gray-400">{formatDate(msg.created_at)}</p>
                  </div>
                  <div className="flex gap-1">
                    {msg.status !== "approved" && (
                      <Button variant="ghost" size="sm" onClick={() => approveMutation.mutate(msg.id)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {msg.status === "approved" && (
                      <Button variant="ghost" size="sm" onClick={() => unapproveMutation.mutate(msg.id)}>
                        <X className="h-4 w-4 text-yellow-600" />
                      </Button>
                    )}
                    {msg.status !== "rejected" && (
                      <Button variant="ghost" size="sm" onClick={() => rejectMutation.mutate(msg.id)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(msg.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
