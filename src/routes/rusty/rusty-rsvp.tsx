import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRustyContext } from "./rusty-layout";
import { useGuestAuth } from "../../lib/guest-auth";
import { supabase, type EventRsvp, type UserEvent } from "../../lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RUSTY_THEME } from "../../lib/theme";
import { cn, formatDate, formatTime, isRsvpClosed } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Check, X, Loader2, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, CalendarCheck } from "lucide-react";

export type Lang = "en" | "id";

interface RsvpFormState {
  status: "attending" | "declined" | "pending" | "";
  plus_ones: number;
  dietary: string;
  message: string;
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
      <div className="h-px w-16" style={{ backgroundColor: RUSTY_THEME.accentColor }} />
    </div>
  );
}

export default function RustyRsvp() {
  const { event, subEvents } = useRustyContext();
  const { guestName, isAuthenticated } = useGuestAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const rsvpTargets = subEvents.length > 0
    ? subEvents.filter((se) => se.rsvp_enabled)
    : [{ id: "__main__", name: event.name, date: event.event_date, time: event.event_time, venue: event.venue, address: event.address, description: null, dress_code: null, rsvp_deadline: event.rsvp_deadline, rsvp_enabled: true, order_index: 0, parent_event_id: event.id, created_at: "", updated_at: "" }];

  const [forms, setForms] = useState<Record<string, RsvpFormState>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: existingRsvps = [], isLoading } = useQuery({
    queryKey: ["rusty-rsvps", event.id, guestName],
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
      queryClient.invalidateQueries({ queryKey: ["rusty-rsvps", event.id, guestName] });
      setToast({ type: "success", msg: "RSVP submitted. Thank you!" });
    },
    onError: (err: Error) => {
      setToast({ type: "error", msg: err.message || "Failed to submit RSVP." });
    },
  });

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm mb-6" style={{ color: RUSTY_THEME.textMutedColor! }}>Please sign in to submit your RSVP.</p>
        <Button onClick={() => navigate("./login")} style={{ backgroundColor: RUSTY_THEME.accentColor!, color: "#F5ECD7", borderRadius: "2px" }}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: RUSTY_THEME.accentColor! }} />
      </div>
    );
  }

  const updateForm = (targetId: string, patch: Partial<RsvpFormState>) => {
    setForms((prev) => ({ ...prev, [targetId]: { ...prev[targetId], ...patch } }));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: RUSTY_THEME.bgColor!, color: RUSTY_THEME.textColor! }}>
      <header className="pt-16 pb-8 text-center px-6">
        <CalendarCheck className="w-6 h-6 mx-auto mb-3" style={{ color: RUSTY_THEME.accentColor! }} />
        <h1 className="font-serif text-3xl" style={{ fontFamily: RUSTY_THEME.headingFont }}>RSVP</h1>
        <p className="text-sm mt-2 font-serif italic" style={{ fontFamily: RUSTY_THEME.scriptFont, color: RUSTY_THEME.textMutedColor! }}>
          Let us know if you'll be joining us
        </p>
        <GoldDivider />
      </header>

      <div className="max-w-xl mx-auto px-6 pb-12 space-y-8">
        {rsvpTargets.map((target) => {
          const closed = isRsvpClosed(target.rsvp_deadline);
          const realId = target.id === "__main__" ? null : target.id;
          const form = forms[target.id] || { status: "", plus_ones: 0, dietary: "", message: "" };
          const isSubmitting = submitMutation.isPending && submitMutation.variables?.targetId === target.id;

          return (
            <div key={target.id} className="p-6" style={{ border: `1px solid ${RUSTY_THEME.borderColor}`, borderRadius: "2px", backgroundColor: RUSTY_THEME.bgSubtleColor }}>
              <div className="mb-5">
                <h2 className="font-serif text-xl mb-2" style={{ fontFamily: RUSTY_THEME.headingFont }}>{target.name}</h2>
                {target.date && <p className="text-xs flex items-center gap-1.5" style={{ color: RUSTY_THEME.textMutedColor! }}><Calendar className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{formatDate(target.date)}</p>}
                {target.time && <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}><Clock className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{formatTime(target.time)}</p>}
                {target.venue && <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: RUSTY_THEME.textMutedColor! }}><MapPin className="w-3 h-3" style={{ color: RUSTY_THEME.accentColor! }} />{target.venue}</p>}
                {target.rsvp_deadline && (
                  <p className={cn("text-xs mt-2", closed ? "text-red-500" : "")} style={!closed ? { color: RUSTY_THEME.textMutedColor! } : undefined}>
                    {closed ? "RSVP has closed" : `RSVP by ${formatDate(target.rsvp_deadline)}`}
                  </p>
                )}
              </div>

              {closed ? (
                <div className="flex items-center gap-2 py-6 text-center justify-center text-sm" style={{ color: RUSTY_THEME.textMutedColor! }}>
                  <AlertCircle className="w-4 h-4" />
                  RSVP is closed for this event.
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: RUSTY_THEME.accentColor! }}>Will you attend?</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateForm(target.id, { status: "attending" })}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-wider border transition-all",
                          form.status === "attending"
                            ? "text-[#F5ECD7]"
                            : "hover:opacity-70"
                        )}
                        style={{
                          borderRadius: "2px",
                          borderColor: RUSTY_THEME.accentColor,
                          backgroundColor: form.status === "attending" ? RUSTY_THEME.accentColor : "transparent",
                          color: form.status === "attending" ? "#F5ECD7" : RUSTY_THEME.textColor,
                        }}
                      >
                        <Check className="w-4 h-4" /> Attending
                      </button>
                      <button
                        type="button"
                        onClick={() => updateForm(target.id, { status: "declined" })}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-wider border transition-all",
                          form.status === "declined" ? "text-[#F5ECD7]" : "hover:opacity-70"
                        )}
                        style={{
                          borderRadius: "2px",
                          borderColor: RUSTY_THEME.accentColor,
                          backgroundColor: form.status === "declined" ? RUSTY_THEME.accentColor : "transparent",
                          color: form.status === "declined" ? "#F5ECD7" : RUSTY_THEME.textColor,
                        }}
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>

                  {form.status === "attending" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: RUSTY_THEME.accentColor! }}>Plus Ones</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateForm(target.id, { plus_ones: Math.max(0, form.plus_ones - 1) })}
                            className="w-10 h-10 border flex items-center justify-center hover:opacity-70"
                            style={{ borderRadius: "2px", borderColor: RUSTY_THEME.borderColor, color: RUSTY_THEME.accentColor }}
                          >−</button>
                          <span className="font-serif text-2xl min-w-[40px] text-center" style={{ fontFamily: RUSTY_THEME.headingFont, color: RUSTY_THEME.accentColor }}>{form.plus_ones}</span>
                          <button
                            type="button"
                            onClick={() => updateForm(target.id, { plus_ones: Math.min(10, form.plus_ones + 1) })}
                            className="w-10 h-10 border flex items-center justify-center hover:opacity-70"
                            style={{ borderRadius: "2px", borderColor: RUSTY_THEME.borderColor, color: RUSTY_THEME.accentColor }}
                          >+</button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: RUSTY_THEME.accentColor! }}>Dietary Requirements</label>
                        <Input
                          type="text"
                          value={form.dietary}
                          onChange={(e) => updateForm(target.id, { dietary: e.target.value })}
                          placeholder="e.g. Vegetarian, gluten-free, allergies..."
                          maxLength={200}
                          style={{ backgroundColor: "#F5ECD7", borderColor: RUSTY_THEME.borderColor, color: RUSTY_THEME.textColor, borderRadius: "2px" }}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: RUSTY_THEME.accentColor! }}>Message (optional)</label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => updateForm(target.id, { message: e.target.value })}
                      placeholder="Leave a note for the hosts..."
                      maxLength={500}
                      className="min-h-[80px]"
                      style={{ backgroundColor: "#F5ECD7", borderColor: RUSTY_THEME.borderColor, color: RUSTY_THEME.textColor, borderRadius: "2px" }}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => submitMutation.mutate({ targetId: target.id, subEventId: realId })}
                    disabled={!form.status || isSubmitting}
                    loading={isSubmitting}
                    className="w-full"
                    style={{ backgroundColor: RUSTY_THEME.accentColor!, color: "#F5ECD7", borderRadius: "2px" }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit RSVP"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 shadow-lg" style={{ borderRadius: "2px", backgroundColor: toast.type === "success" ? RUSTY_THEME.accentColor : "#B91C1C", color: "#F5ECD7" }}>
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{toast.msg}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
