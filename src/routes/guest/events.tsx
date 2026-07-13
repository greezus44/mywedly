import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar, Clock, MapPin, Users, Check, X, HelpCircle, MessageSquare,
  Utensils, UserPlus, Save, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WeddingEvent, Rsvp } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { getTheme, themeToCssVars } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, Badge, Modal, EmptyState } from "@/components/ui";
import { Input, Textarea, Label, Select } from "@/components/ui/Input";

type GroupInviteRow = { group_id: string; event_id: string };
type GuestInviteRow = { guest_id: string; event_id: string; invite_type: string };

type RsvpForm = {
  status: string;
  meal_choice: string;
  dietary_restrictions: string;
  plus_one_name: string;
  message: string;
};

const STATUS_OPTIONS = [
  { value: "attending", label: "Attending", variant: "success" as const },
  { value: "not_attending", label: "Not Attending", variant: "danger" as const },
  { value: "maybe", label: "Maybe", variant: "warning" as const },
];

export function GuestEvents() {
  const { wedding, guest, loading } = useGuestData();
  const theme: ThemeConfig = useMemo(() => getTheme(wedding), [wedding]);
  const cssVars = useMemo(() => themeToCssVars(theme), [theme]);

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInviteRow[]>([]);
  const [guestInvites, setGuestInvites] = useState<GuestInviteRow[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [fetching, setFetching] = useState(true);
  const [rsvpModalEvent, setRsvpModalEvent] = useState<WeddingEvent | null>(null);
  const [rsvpForm, setRsvpForm] = useState<RsvpForm>({
    status: "attending",
    meal_choice: "",
    dietary_restrictions: "",
    plus_one_name: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const weddingId = wedding?.id ?? "";
  const guestId = guest?.id ?? "";

  // ─── Load all data ───
  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [ev, gi, guestI, rsvpRes] = await Promise.all([
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("group_event_invites").select("*"),
      supabase.from("guest_event_invites").select("*"),
      supabase.from("rsvps").select("*").eq("guest_id", guestId),
    ]);
    if (ev.data) setEvents(ev.data as WeddingEvent[]);
    if (gi.data) setGroupInvites(gi.data as GroupInviteRow[]);
    if (guestI.data) setGuestInvites(guestI.data as GuestInviteRow[]);
    if (rsvpRes.data) setRsvps(rsvpRes.data as Rsvp[]);
    setFetching(false);
  }, [weddingId, guestId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Compute invited events ───
  // Precedence: manual exclude > manual include > group invite > not invited
  const invitedEvents = useMemo(() => {
    if (!guest) return [] as WeddingEvent[];
    const result: WeddingEvent[] = [];
    for (const ev of events) {
      const manual = guestInvites.find(
        (gi) => gi.guest_id === guest.id && gi.event_id === ev.id
      );
      if (manual?.invite_type === "exclude") continue; // manual exclude wins
      if (manual?.invite_type === "include") { result.push(ev); continue; }
      if (guest.group_id) {
        const groupInvited = groupInvites.some(
          (gi) => gi.group_id === guest.group_id && gi.event_id === ev.id
        );
        if (groupInvited) { result.push(ev); continue; }
      }
      // not invited — skip
    }
    return result;
  }, [events, guest, guestInvites, groupInvites]);

  // ─── RSVP map ───
  const rsvpMap = useMemo(() => {
    const map = new Map<string, Rsvp>();
    for (const r of rsvps) {
      if (r.event_id) map.set(r.event_id, r);
    }
    return map;
  }, [rsvps]);

  // ─── Open RSVP modal ───
  const openRsvpModal = (event: WeddingEvent) => {
    const existing = rsvpMap.get(event.id);
    setRsvpForm({
      status: existing?.status ?? "attending",
      meal_choice: existing?.meal_choice ?? "",
      dietary_restrictions: existing?.dietary_restrictions ?? "",
      plus_one_name: existing?.plus_one_name ?? "",
      message: existing?.message ?? "",
    });
    setRsvpModalEvent(event);
  };

  // ─── Save RSVP ───
  const saveRsvp = async () => {
    if (!rsvpModalEvent || !guest || !weddingId) return;
    setSaving(true);
    const existing = rsvpMap.get(rsvpModalEvent.id);
    const payload = {
      wedding_id: weddingId,
      guest_id: guest.id,
      guest_name: guest.full_name,
      guest_email: guest.email,
      event_id: rsvpModalEvent.id,
      status: rsvpForm.status,
      meal_choice: rsvpForm.meal_choice.trim() || null,
      dietary_restrictions: rsvpForm.dietary_restrictions.trim() || null,
      plus_one_name: guest.plus_one_allowed ? (rsvpForm.plus_one_name.trim() || null) : null,
      message: rsvpForm.message.trim() || null,
    };

    let error: { message: string } | null = null;
    if (existing) {
      ({ error } = await supabase
        .from("rsvps")
        .update({
          status: payload.status,
          meal_choice: payload.meal_choice,
          dietary_restrictions: payload.dietary_restrictions,
          plus_one_name: payload.plus_one_name,
          message: payload.message,
        })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("rsvps").insert(payload));
    }

    setSaving(false);
    if (error) { showToast(`Save failed: ${error.message}`, "error"); return; }
    showToast("RSVP saved!");
    setRsvpModalEvent(null);
    await loadAll();
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading events…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" />;
  }

  return (
    <div style={cssVars as React.CSSProperties} className="animate-fade-in px-6 py-12" >
      <div className="max-w-4xl mx-auto">
        {/* ─── Header ─── */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "var(--c-textMuted)" }}>
            Schedule
          </p>
          <h1 className="text-4xl font-serif" style={{ color: "var(--c-text)" }}>
            Events
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--c-textMuted)" }}>
            {invitedEvents.length} {invitedEvents.length === 1 ? "event" : "events"} invited
          </p>
        </div>

        {/* ─── Event cards ─── */}
        {invitedEvents.length === 0 ? (
          <EmptyState
            title="No events to show"
            description="You haven't been invited to any events yet, or events haven't been published."
          />
        ) : (
          <div className="space-y-6">
            {invitedEvents.map((event) => {
              const rsvp = rsvpMap.get(event.id);
              const statusOption = STATUS_OPTIONS.find((s) => s.value === rsvp?.status);

              return (
                <Card key={event.id} className="overflow-hidden">
                  {event.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                      <Badge
                        variant="info"
                        className="absolute top-3 right-3 bg-white/90 capitalize"
                      >
                        {event.kind}
                      </Badge>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-serif mb-1" style={{ color: "var(--c-text)" }}>
                          {event.name}
                        </h2>
                        {!event.image_url && (
                          <Badge variant="info" className="capitalize">{event.kind}</Badge>
                        )}
                      </div>
                      {rsvp && statusOption && (
                        <Badge variant={statusOption.variant} className="flex items-center gap-1">
                          {rsvp.status === "attending" && <Check className="w-3 h-3" />}
                          {rsvp.status === "not_attending" && <X className="w-3 h-3" />}
                          {rsvp.status === "maybe" && <HelpCircle className="w-3 h-3" />}
                          {statusOption.label}
                        </Badge>
                      )}
                    </div>

                    {/* Event details */}
                    <div className="space-y-2 text-sm" style={{ color: "var(--c-textMuted)" }}>
                      {event.starts_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.starts_at)}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{formatTime(event.starts_at)}</span>
                        </div>
                      )}
                      {event.venue_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.venue_name}</span>
                        </div>
                      )}
                      {event.venue_address && (
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-xs">{event.venue_address}</span>
                        </div>
                      )}
                      {event.dress_code && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center text-xs">◈</span>
                          <span>{event.dress_code}</span>
                        </div>
                      )}
                      {event.capacity != null && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.capacity} guests</span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm mt-4 whitespace-pre-line" style={{ color: "var(--c-textMuted)" }}>
                        {event.description}
                      </p>
                    )}

                    {event.maps_url && (
                      <a
                        href={event.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-3 transition-colors hover:underline"
                        style={{ color: "var(--c-link)" }}
                      >
                        <MapPin className="w-3 h-3" /> View on map <ChevronRight className="w-3 h-3" />
                      </a>
                    )}

                    {/* RSVP button */}
                    <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--c-secondary)" }}>
                      <Button
                        onClick={() => openRsvpModal(event)}
                        variant={rsvp ? "outline" : "primary"}
                      >
                        {rsvp ? "Edit RSVP" : "RSVP to this event"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── RSVP Modal ─── */}
      <Modal
        open={!!rsvpModalEvent}
        onClose={() => setRsvpModalEvent(null)}
        title={`RSVP — ${rsvpModalEvent?.name ?? ""}`}
      >
        <div className="space-y-5">
          {/* Status */}
          <div>
            <Label>Will you be attending?</Label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRsvpForm((f) => ({ ...f, status: opt.value }))}
                  className={cn(
                    "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                    rsvpForm.status === opt.value
                      ? "border-transparent text-white"
                      : "border-sand bg-white text-sepia hover:bg-mist"
                  )}
                  style={rsvpForm.status === opt.value ? {
                    background: "var(--c-button)",
                    color: "var(--c-buttonText)",
                  } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal choice */}
          <div>
            <Label>Meal Choice</Label>
            <Input
              value={rsvpForm.meal_choice}
              onChange={(e) => setRsvpForm((f) => ({ ...f, meal_choice: e.target.value }))}
              placeholder="e.g. Chicken, Beef, Vegetarian"
            />
          </div>

          {/* Dietary restrictions */}
          <div>
            <Label>Dietary Restrictions</Label>
            <Textarea
              rows={2}
              value={rsvpForm.dietary_restrictions}
              onChange={(e) => setRsvpForm((f) => ({ ...f, dietary_restrictions: e.target.value }))}
              placeholder="Allergies, restrictions, etc."
            />
          </div>

          {/* Plus one */}
          {guest?.plus_one_allowed && (
            <div>
              <Label>
                <span className="inline-flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Plus One Name
                </span>
              </Label>
              <Input
                value={rsvpForm.plus_one_name}
                onChange={(e) => setRsvpForm((f) => ({ ...f, plus_one_name: e.target.value }))}
                placeholder="Your guest's name"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <Label>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Message to the couple
              </span>
            </Label>
            <Textarea
              rows={3}
              value={rsvpForm.message}
              onChange={(e) => setRsvpForm((f) => ({ ...f, message: e.target.value }))}
              placeholder="Share your excitement or a note for the couple…"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRsvpModalEvent(null)}>
              Cancel
            </Button>
            <Button onClick={saveRsvp} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save RSVP"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Toast ─── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg",
              toast.type === "success" ? "bg-onyx text-parchment" : "bg-red-600 text-white"
            )}
          >
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestEvents;
