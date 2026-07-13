import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { supabase, type Wedding, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { cn } from "../../lib/utils";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: messages, isLoading: mLoading } = useQuery({
    queryKey: ["messages", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", wedding?.id] });
      setToast({ message: "Message approved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to approve message", type: "error" }),
  });

  const unapproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ is_approved: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", wedding?.id] });
      setToast({ message: "Message unapproved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to unapprove message", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", wedding?.id] });
      setToast({ message: "Message deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete message", type: "error" }),
  });

  const filteredMessages = (messages || []).filter((m) => {
    const matchesSearch =
      m.author_name.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !m.is_approved) ||
      (filter === "approved" && m.is_approved);
    return matchesSearch && matchesFilter;
  });

  const pendingCount = (messages || []).filter((m) => !m.is_approved).length;
  const approvedCount = (messages || []).filter((m) => m.is_approved).length;

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  const loading = wLoading || mLoading;

  const filterTabs = [
    { key: "all" as const, label: "All", count: messages?.length || 0 },
    { key: "pending" as const, label: "Pending", count: pendingCount },
    { key: "approved" as const, label: "Approved", count: approvedCount },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-6">
            <h1 className="font-heading text-3xl text-[var(--color-text)] mb-1">Messages</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">
              Review and approve guest messages from your guestbook
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-1 bg-[var(--color-bg)] rounded-lg p-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    "px-4 py-2 rounded-md font-ui text-xs uppercase tracking-wider-luxe transition-all",
                    filter === tab.key
                      ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="max-w-xs flex-1"
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-5 w-32 bg-gray-100 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                </Card>
              ))}
            </div>
          ) : filteredMessages.length > 0 ? (
            <div className="space-y-4">
              {filteredMessages.map((msg) => (
                <Card key={msg.id} className={cn("p-5", !msg.is_approved && "border-[var(--color-warning)]/30")}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center font-heading text-lg text-[var(--color-primary)]">
                        {msg.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-ui text-sm font-medium text-[var(--color-text)]">{msg.author_name}</p>
                        <p className="font-ui text-xs text-[var(--color-text-muted)]">
                          {new Date(msg.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={msg.is_approved ? "success" : "warning"}>
                      {msg.is_approved ? (
                        <span className="flex items-center gap-1"><CheckCircle size={10} /> Approved</span>
                      ) : (
                        <span className="flex items-center gap-1"><Clock size={10} /> Pending</span>
                      )}
                    </Badge>
                  </div>

                  <p className="font-body text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-line mb-4">
                    {msg.message}
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]/10">
                    {msg.is_approved ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unapproveMutation.mutate(msg.id)}
                        disabled={unapproveMutation.isPending}
                      >
                        Unapprove
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => approveMutation.mutate(msg.id)}
                        disabled={approveMutation.isPending}
                      >
                        <Check size={12} className="mr-1.5" />
                        Approve
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteMutation.mutate(msg.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={12} className="mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : search || filter !== "all" ? (
            <EmptyState
              icon={<MessageSquare size={32} />}
              title="No messages found"
              description={search ? `No messages match "${search}"` : "No messages in this category"}
            />
          ) : (
            <EmptyState
              icon={<MessageSquare size={32} />}
              title="No messages yet"
              description="Guest messages from your guestbook will appear here for approval"
            />
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
