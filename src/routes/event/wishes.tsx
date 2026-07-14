import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";

export function WishesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [pageSettings, setPageSettings] = useState<string>("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ["event_messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event?.draft_content) {
      const content = event.draft_content as Record<string, unknown>;
      setPageSettings((content.wishes as string) ?? "");
    }
  }, [event]);

  const saveSettings = async () => {
    if (!event) return;
    setSavingSettings(true);
    const content = { ...(event.draft_content as Record<string, unknown> ?? {}), wishes: pageSettings };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_content: content })
      .eq("id", event.id);
    setSavingSettings(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event_messages", eventId] });
      setDeleteId(null);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Wishes</h2>
        <p className="text-sm text-gray-500">Manage guest wishes and customise the wishes page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Page Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wishes Page Content</label>
              <RichTextEditor value={pageSettings} onChange={setPageSettings} placeholder="Add a message for your guests…" />
            </div>
            <Button size="sm" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? "Saving…" : "Save Page Settings"}
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Guest Wishes ({messages?.length ?? 0})</h3>
          {msgLoading ? (
            <p className="text-sm text-gray-500">Loading wishes…</p>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{msg.guest_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteId(msg.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No wishes yet. They will appear here when guests submit them.</p>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-lg p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Wish?</h3>
            <p className="text-sm text-gray-600 mb-4">This wish will be permanently removed. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
