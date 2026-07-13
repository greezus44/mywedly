import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Toast } from "../../components/ui";
import { useGuestAuth } from "../../lib/guest-auth";
import { useState } from "react";

type Ctx = { event: UserEvent };
type Message = { id: string; guest_name: string; message: string; created_at: string };

export default function GuestWishesPage() {
  const { event } = useOutletContext<Ctx>();
  const { guestName } = useGuestAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const { data: messages, refetch } = useQuery({
    queryKey: ["event-messages", event.id],
    queryFn: async () => { const { data, error } = await supabase.from("event_messages").select("*").eq("event_id", event.id).order("created_at", { ascending: false }); if (error) throw error; return data as Message[]; },
  });

  const submitMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("event_messages").insert({ event_id: event.id, guest_name: guestName || "Guest", message }); if (error) throw error; },
    onSuccess: () => { setMessage(""); refetch(); setToast("Wish posted!"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="font-heading text-3xl text-center mb-8">Wishes</h1>
        <Card className="p-4 mb-8 space-y-3">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full p-3 border rounded-lg text-sm bg-transparent border-current/20" placeholder="Write a wish..." />
          <Button onClick={() => submitMutation.mutate()} loading={submitMutation.isPending} disabled={!message.trim()} size="sm">Post Wish</Button>
        </Card>
        <div className="space-y-4">
          {messages?.map((m) => (
            <Card key={m.id} className="p-5"><p className="text-sm mb-2">{m.message}</p><p className="text-xs opacity-60">— {m.guest_name}</p></Card>
          ))}
          {(!messages || messages.length === 0) && <p className="text-center text-sm opacity-50">No wishes yet. Be the first!</p>}
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
