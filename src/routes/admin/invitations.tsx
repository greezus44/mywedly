import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Mail, Users, Check, X, ChevronDown, Save, Info, UserCheck, UserX,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup, WeddingEvent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import { Card, Badge, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { cn, formatDateShort, formatTime } from "@/lib/utils";

type GroupInviteRow = { group_id: string; event_id: string; created_at: string };
type GuestInviteRow = { guest_id: string; event_id: string; invite_type: string; created_at: string };

export function AdminInvitations() {
  const { wedding, loading } = useHostWedding();
  const weddingId = wedding?.id ?? "";

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInviteRow[]>([]);
  const [guestInvites, setGuestInvites] = useState<GuestInviteRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Load ───
  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [ev, gr, g, gi, guestI] = await Promise.all([
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("starts_at", { ascending: true }),
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
      supabase.from("group_event_invites").select("*"),
      supabase.from("guest_event_invites").select("*"),
    ]);
    if (ev.data) setEvents(ev.data as WeddingEvent[]);
    if (gr.data) setGroups(gr.data as GuestGroup[]);
    if (g.data) setGuests(g.data as Guest[]);
    if (gi.data) setGroupInvites(gi.data as GroupInviteRow[]);
    if (guestI.data) setGuestInvites(guestI.data as GuestInviteRow[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  // Auto-select first event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  // ─── Derived maps ───
  const groupMembersMap = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const g of guests) {
      if (g.group_id) {
        const arr = map.get(g.group_id) ?? [];
        arr.push(g);
        map.set(g.group_id, arr);
      }
    }
    return map;
  }, [guests]);

  const invitedGroupIds = useMemo(() => {
    const set = new Set<string>();
    for (const gi of groupInvites) {
      if (gi.event_id === selectedEventId) set.add(gi.group_id);
    }
    return set;
  }, [groupInvites, selectedEventId]);

  const guestInviteMap = useMemo(() => {
    // Map<guest_id, invite_type> for the selected event
    const map = new Map<string, string>();
    for (const gi of guestInvites) {
      if (gi.event_id === selectedEventId) map.set(gi.guest_id, gi.invite_type);
    }
    return map;
  }, [guestInvites, selectedEventId]);

  // ─── Compute invited guests ───
  // Precedence: manual exclude > manual include > group invite
  const invitedGuests = useMemo(() => {
    if (!selectedEventId) return new Set<string>();
    const invited = new Set<string>();
    for (const g of guests) {
      const manual = guestInviteMap.get(g.id);
      if (manual === "exclude") continue; // manual exclude wins
      if (manual === "include") { invited.add(g.id); continue; }
      if (g.group_id && invitedGroupIds.has(g.group_id)) invited.add(g.id);
    }
    return invited;
  }, [guests, guestInviteMap, invitedGroupIds, selectedEventId]);

  const invitedCount = invitedGuests.size;

  // ─── Toggle group invite ───
  const toggleGroupInvite = async (groupId: string) => {
    if (!selectedEventId) return;
    setSaving(true);
    const existing = groupInvites.find((gi) => gi.group_id === groupId && gi.event_id === selectedEventId);
    if (existing) {
      const { error } = await supabase.from("group_event_invites").delete()
        .eq("group_id", groupId).eq("event_id", selectedEventId);
      if (error) { showToast(`Failed: ${error.message}`, "error"); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("group_event_invites").insert({
        group_id: groupId,
        event_id: selectedEventId,
      });
      if (error) { showToast(`Failed: ${error.message}`, "error"); setSaving(false); return; }
    }
    setSaving(false);
    await loadAll();
  };

  // ─── Toggle individual override ───
  const toggleGuestOverride = async (guestId: string, type: "include" | "exclude") => {
    if (!selectedEventId) return;
    setSaving(true);
    const existing = guestInvites.find((gi) => gi.guest_id === guestId && gi.event_id === selectedEventId);
    if (existing && existing.invite_type === type) {
      // Toggle off — remove the override
      const { error } = await supabase.from("guest_event_invites").delete()
        .eq("guest_id", guestId).eq("event_id", selectedEventId);
      if (error) { showToast(`Failed: ${error.message}`, "error"); setSaving(false); return; }
    } else {
      if (existing) {
        const { error } = await supabase.from("guest_event_invites").update({ invite_type: type })
          .eq("guest_id", guestId).eq("event_id", selectedEventId);
        if (error) { showToast(`Failed: ${error.message}`, "error"); setSaving(false); return; }
      } else {
        const { error } = await supabase.from("guest_event_invites").insert({
          guest_id: guestId,
          event_id: selectedEventId,
          invite_type: type,
        });
        if (error) { showToast(`Failed: ${error.message}`, "error"); setSaving(false); return; }
      }
    }
    setSaving(false);
    await loadAll();
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading invitations…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage invitations." />;
  }

  if (events.length === 0) {
    return (
      <div>
        <SectionTitle title="Invitations" subtitle="Choose which groups and guests are invited to each event." />
        <EmptyState
          title="No events yet"
          description="Create events first, then manage who's invited to each."
        />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        title="Invitations"
        subtitle="Choose which groups and guests are invited to each event."
      />

      {/* ─── Event selector ─── */}
      <Card className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <Label>Select Event</Label>
            <Select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {formatDateShort(e.starts_at)}
                </option>
              ))}
            </Select>
          </div>
          {selectedEvent && (
            <div className="flex items-center gap-3 text-sm text-sepia">
              <Badge variant="info">{selectedEvent.kind}</Badge>
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-onyx">{formatTime(selectedEvent.starts_at)}</span>
                {selectedEvent.venue_name && <span>· {selectedEvent.venue_name}</span>}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ─── Summary ─── */}
      <Card className="p-5 mb-6 bg-mist/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center">
            <Mail className="w-5 h-5 text-sepia" />
          </div>
          <div>
            <p className="text-2xl font-serif text-onyx">
              {invitedCount} <span className="text-base text-sepia/70 font-sans">of {guests.length}</span>
            </p>
            <p className="text-xs text-sepia/70 uppercase tracking-widest">Guests invited to this event</p>
          </div>
        </div>
      </Card>

      {/* ─── Precedence note ─── */}
      <div className="flex items-start gap-2 mb-6 text-xs text-sepia/70 bg-sand/30 rounded-lg p-3">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-medium text-sepia">Precedence:</span> Manual exclude &gt; manual include &gt; group invite.
          A guest individually excluded will not be invited even if their group is.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ─── Group invites ─── */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">Group Invites</h3>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-sepia/60 py-6 text-center">No groups created yet.</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((group) => {
                const isInvited = invitedGroupIds.has(group.id);
                const memberCount = (groupMembersMap.get(group.id) ?? []).length;
                return (
                  <li key={group.id}>
                    <button
                      onClick={() => toggleGroupInvite(group.id)}
                      disabled={saving}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 p-3 rounded-lg border transition-all text-left",
                        isInvited
                          ? "border-sepia/40 bg-mist/50"
                          : "border-sand bg-card hover:border-sepia/20"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          isInvited ? "bg-onyx border-onyx" : "border-sand"
                        )}>
                          {isInvited && <Check className="w-3.5 h-3.5 text-parchment" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-onyx truncate">{group.name}</p>
                          <p className="text-xs text-sepia/60">{memberCount} {memberCount === 1 ? "member" : "members"}</p>
                        </div>
                      </div>
                      {isInvited && <Badge variant="success">Invited</Badge>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ─── Individual overrides ─── */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">Individual Overrides</h3>
          </div>
          {guests.length === 0 ? (
            <p className="text-sm text-sepia/60 py-6 text-center">No guests to override.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto -mr-2 pr-2">
              <ul className="space-y-1.5">
                {guests.map((guest) => {
                  const override = guestInviteMap.get(guest.id);
                  const groupInvited = guest.group_id ? invitedGroupIds.has(guest.group_id) : false;
                  const isInvited = invitedGuests.has(guest.id);
                  const groupName = groups.find((g) => g.id === guest.group_id)?.name;
                  return (
                    <li
                      key={guest.id}
                      className={cn(
                        "flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-colors",
                        override === "exclude" ? "border-red-200 bg-red-50/50" :
                        override === "include" ? "border-green-200 bg-green-50/50" :
                        "border-sand"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          isInvited ? "bg-green-500" : "bg-sand"
                        )} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-onyx truncate">{guest.full_name}</p>
                          <p className="text-xs text-sepia/60 truncate">
                            {groupName ?? "Ungrouped"}
                            {groupInvited && !override && " · via group"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleGuestOverride(guest.id, "include")}
                          disabled={saving}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            override === "include"
                              ? "bg-green-100 text-green-700"
                              : "text-sepia/40 hover:bg-green-50 hover:text-green-600"
                          )}
                          title="Manually include"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleGuestOverride(guest.id, "exclude")}
                          disabled={saving}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            override === "exclude"
                              ? "bg-red-100 text-red-700"
                              : "text-sepia/40 hover:bg-red-50 hover:text-red-600"
                          )}
                          title="Manually exclude"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminInvitations;
