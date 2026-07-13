import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Toast } from "../../components/ui";
import { useGuestAuth } from "../../lib/guest-auth";
import { useState } from "react";

type Ctx = { event: UserEvent };
export default function GuestRsvpPage() {
  const { event } = useOutletContext<Ctx>();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { guestName } = useGuestAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [status, setStatus] = useState<"attending" | "declined" | null>(null);
  const [plusOnes, setPlusOnes] = useState(0);
  const [message, setMessage] = useState("");

  const { data: subEvents } = useQuery({
    queryKey: ["public-sub-events", event.id],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_eventId", event.id).order("order_index"); if (error) throw error; return data as SubEvent[]; },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: guest } = await supabase.from("event_guests").select("id").eq("event_id", event.id).eq("name", guestName).maybeSingle();
      const guestId = guest?.id || null;
      const { error } = await supabase.from("event_rsvps").insert({ event_id: event.id, guest_id: guestId, guest_name: guestName, status, plus_ones: plusOnes, message: message || null });
      if (error) throw error;
    },
    onSuccess: () => { setToast("RSVP submitted. Thank you!"); setTimeout(() => navigate(`/e/${slug}/home`), 2000); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="font-heading text-3xl text-center mb-2">RSVP</h1>
        <p className="text-sm text-center opacity-60 mb-8">Welcome, {guestName || "Guest"}</p>
        <Card className="space-y-6 p-6">
          <div><p className="text-sm font-medium mb-3">Will you attend?</p><div className="grid grid-cols-2 gap-3"><button onClick={() => setStatus("attending")} className={`py-3 border rounded-lg text-sm font-medium transition-all ${status === "attending" ? "bg-current text-inverted border-current" : "border-current/20 hover:border-current/40"}`}>Joyfully Accept</button><button onClick={() => setStatus("declined")} className={`py-3 border rounded-lg text-sm font-medium transition-all ${status === "declined" ? "bg-current text-inverted border-current" : "border-current/20 hover:border-current/40"}`}>Regretfully Decline</button></div></div>
          {status === "attending" && <div><p className="text-sm font-medium mb-3">Number of guests (including you)</p><div className="flex items-center gap-4"><button onClick={() => setPlusOnes(Math.max(0, plusOnes - 1))} className="w-10 h-10 border rounded-full">-</button><span className="text-xl font-heading">{plusOnes + 1}</span><button onClick={() => setPlusOnes(plusOnes + 1)} className="w-10 h-10 border rounded-full">+</button></div></div>}
          <div><p className="text-sm font-medium mb-2">Message (optional)</p><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full p-3 border rounded-lg text-sm bg-transparent border-current/20" placeholder="Send your love..." /></div>
          <Button onClick={() => submitMutation.mutate()} loading={submitMutation.isPending} disabled={!status} className="w-full">Submit RSVP</Button>
        </Card>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
