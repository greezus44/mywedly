import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGuestContext } from "./guest-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn, formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Check, X, Loader2, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, CalendarCheck } from "lucide-react";

interface RsvpFormState {
  status: "attending" | "declined" | "pending" | "";
  plus_ones: number;
  dietary: string;
  message: string;
}

export default function GuestRsvp() {
  const { event, subEvents } = useGuestContext();
  const { guestName, isAuthenticated } = useGuestAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // If no sub-events, use a single "main event" form keyed by null sub_event_id
  const rsvpTargets = subEvents.length > 0
    ? subEvents.filter((se) => se.rsvp_enabled)
    : [{ id: "__main__", name: event.name, date: event.event_date, time: event.event_time, venue: event.venue, address: event.address, description: null, dress_code: null, rsvp_deadline: event.rsvp_deadline, rsvp_enabled: true, order_index: 0, parent_event_id: event.id, created_at: "", updated_at: "" }];

  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load existing RSVPs for this guest
  const { data: existingRsvps = [], isLoading } = useQuery({
    queryKey: ["guest-rsvps", event.id, guestName],
    queryFn: async () => {
      if (!guestName) return [];
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", event.id)
        .eq("guest_name", guestName);
      if (error) throw error;
      return (data as EventRsvp[]) || [];
    },
    enabled: !!guestName,
  });

  // Initialize forms from existing RSVPs
  useEffect(() => {
    const initial: Record<string, RsvpFormState> = {};
    rsvpTargets.forEach((target) => {
      const realId = target.id === "__main__" ? null : target.id;
      const existing = existingRsvps.find((r) => r.sub_event_id === realId || (realId === null && r.sub_event_id === null));
      initial[target.id] = {
        status: existing?.status || "",
        plus_ones: existing?.plus_ones || 0,
        dietary: existing?.dietary || "",
        message: existing?.message || "",
      };
    });
    setForms(initial);
  }, [existingRsvps, rsvpTargets.length]);

  const submitMutation = useMutation({
    mutationFn: async (params: { targetId: string; subEventId: string | null }) => {
      if (!guestName) throw new Error("Not signed in");
      const form = forms[params.targetId];
      if (!form || !form.status) throw new Error("Please select Attending or Declined");

      // Check for existing RSVP to update or insert
      const existing = existingRsvps.find(
        (r) => r.sub_event_id === params.subEventId || (params.subEventId === null && r.sub_event_id === null)
      );

      const payload = {
        event_id: event.id,
        sub_event_id: params.subEventId,
        guest_name: guestName,
        status: form.status,
        plus_ones: form.plus_ones,
        dietary: form.dietary,
        message: form.message,
        submitted_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase.from("event_rsvps").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-rsvps", event.id, guestName] });
      setToast({ type: "success", message: "RSVP submitted. Thank you!" });
    },
    onError: (err: Error) => {
      setToast({ type: "error", message: err.message || "Failed to submit RSVP." });
    },
  });

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)] mb-6">Please sign in to submit your RSVP.</p>
        <Button onClick={() => navigate("./login")}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
      </div>
    );
  }

  const updateForm = (targetId: string, patch: Partial<RsvpFormState>) => {
    setForms((prev) => ({ ...prev, [targetId]: { ...prev[targetId], ...patch } }));
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-6 py-10 text-center">
          <CalendarCheck className="w-6 h-6 mx-auto text-[var(--color-accent)] mb-3" />
          <h1 className="font-[var(--font-heading)] text-3xl">RSVP</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Let us know if you'll be joining us</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {rsvpTargets.map((target) => {
          const closed = isRsvpClosed(target.rsvp_deadline);
          const realId = target.id === "__main__" ? null : target.id;
          const form = forms[target.id] || { status: "", plus_ones: 0, dietary: "", message: "" };
          const isSubmitting = submitMutation.isPending && submitMutation.variables?.targetId === target.id;

          return (
            <div key={target.id} className="border border-[var(--color-border)] p-6" style={{ borderRadius: "var(--radius)" }}>
              <div className="mb-5">
                <h2 className="font-[var(--font-heading)] text-xl mb-2">{target.name}</h2>
                {target.date && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatDate(target.date)}</p>}
                {target.time && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1"><Clock className="w-3 h-3" />{formatTime(target.time)}</p>}
                {target.venue && <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1"><MapPin className="w-3 h-3" />{target.venue}</p>}
                {target.rsvp_deadline && (
                  <p className={cn("text-xs mt-2", closed ? "text-red-500" : "text-[var(--color-text-muted)]")}>
                    {closed ? "RSVP has closed" : `RSVP by ${formatDate(target.rsvp_deadline)}`}
                  </p>
                )}
              </div>

              {closed ? (
                <div className="flex items-center gap-2 py-6 text-center justify-center text-sm text-[var(--color-text-muted)]">
                  <AlertCircle className="w-4 h-4" />
                  RSVP is closed for this event.
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Status selection */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Will you attend?</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateForm(target.id, { status: "attending" })}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-wider border transition-all",
                          form.status === "attending"
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)]"
                            : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
                        )}
                        style={{ borderRadius: "var(--radius)" }}
                      >
                        <Check className="w-4 h-4" /> Attending
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm(target.id, { status: "declined" })}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-wider border transition-all",
                          form.status === "declined"
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)]"
                            : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
                        )}
                        style={{ borderRadius: "var(--radius)" }}
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>

                  {/* Conditional fields for attending */}
                  {form.status === "attending" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Plus Ones</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateForm(target.id, { plus_ones: Math.max(0, form.plus_ones - 1) })}
                            className="w-10 h-10 border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-subtle)]"
                            style={{ borderRadius: "var(--radius)" }}
                          >−</button>
                          <span className="font-[var(--font-heading)] text-2xl min-w-[40px] text-center">{form.plus_ones}</span>
                          <button
                            type="button"
                            onClick={() => updateForm(target.id, { plus_ones: Math.min(10, form.plus_ones + 1) })}
                            className="w-10 h-10 border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-subtle)]"
                            style={{ borderRadius: "var(--radius)" }}
                          >+</button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Dietary Requirements</label>
                        <Input
                          type="text"
                          value={form.dietary}
                          onChange={(e) => updateForm(target.id, { dietary: e.target.value })}
                          placeholder="e.g. Vegetarian, gluten-free, allergies..."
                          maxLength={200}
                        />
                      </div>
                    </>
                  )}

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Message (optional)</label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => updateForm(target.id, { message: e.target.value })}
                      placeholder="Leave a note for the hosts..."
                      maxLength={500}
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => submitMutation.mutate({ targetId: target.id, subEventId: realId })}
                    disabled={!form.status || isSubmitting}
                    loading={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Submitting..." : "Submit RSVP"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inline toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 shadow-lg",
            toast.type === "success" ? "bg-[var(--color-primary)] text-[var(--color-bg)]" : "bg-red-600 text-white"
          )} style={{ borderRadius: "var(--radius)" }}>
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
