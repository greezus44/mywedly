import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type SubEvent, type EventRsvp, type GuestGroup, type GroupEventInvite, type OpenRsvpLink } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { GuestForm, type GuestFormValues } from "./guest-form";
import { BulkImportModal } from "./bulk-import";
import { generateUsername, slugify } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

type GuestStatus = "not_invited" | "pending" | "attending" | "declined";

function GuestPhoneNote({ guest, phoneEnabledLinkIds }: { guest: EventGuest; phoneEnabledLinkIds: Set<string> }) {
  if (!guest.open_rsvp_link_id) return null;
  const phone = guest.phone?.trim();
  if (phone) return <span className="block text-xs text-dash-muted">{phone}</span>;
  if (!phoneEnabledLinkIds.has(guest.open_rsvp_link_id) || guest.rsvp_status !== "attending") return null;
  return <span className="block text-xs text-dash-muted">-</span>;
}

function StatusIcon({ status, plusOneLabel }: { status: GuestStatus; plusOneLabel?: string | null }) {
  let icon: React.ReactNode;
  if (status === "attending") icon = <span className="text-green-600 font-bold text-base" title="Attending">&#10003;</span>;
  else if (status === "declined") icon = <span className="text-red-500 font-bold text-base" title="Declined">&#10007;</span>;
  else if (status === "pending") icon = <span className="text-dash-muted font-bold text-base" title="Pending">=</span>;
  else icon = <span className="text-dash-muted text-base" title="Not invited">&mdash;</span>;
  if (!plusOneLabel) return icon;
  const isPlusOne = plusOneLabel === "+1";
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      <span className={`text-xs font-semibold ${isPlusOne ? "text-green-600" : "text-dash-muted"}`} title={isPlusOne ? "Bringing +1" : "No +1"}>{plusOneLabel}</span>
    </span>
  );
}

const UNGROUPED_KEY = "__ungrouped__";

function GroupTick({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={`Select group ${label}`}
      title={`Select all of ${label}`}
      onClick={(e) => e.stopPropagation()}
      onChange={onToggle}
      className="accent-dash-primary shrink-0"
    />
  );
}

function MobileGuestSection({
  status,
  label,
  colour,
  guests,
  selectedGuestIds,
  toggleGuestSelection,
  mobileShowUsername,
  activeEventKey,
  statusFor,
  plusOneLabelFor,
  onEdit,
  onDelete,
  embedded,
  phoneEnabledLinkIds,
}: {
  status: GuestStatus;
  label: string;
  colour: string;
  guests: EventGuest[];
  selectedGuestIds: Set<string>;
  toggleGuestSelection: (id: string) => void;
  mobileShowUsername: boolean;
  activeEventKey: string;
  statusFor: (guestId: string, tabKey: string) => GuestStatus;
  plusOneLabelFor: (guestId: string, tabKey: string) => string | null;
  onEdit: (g: EventGuest) => void;
  onDelete: (g: EventGuest) => void;
  phoneEnabledLinkIds: Set<string>;
  embedded?: boolean;
}) {
  return (
    <div className={embedded ? undefined : "rounded-lg border border-dash-border bg-dash-surface overflow-hidden"}>
      <div className={`px-4 py-1 text-[10px] font-semibold uppercase tracking-wider ${embedded ? "bg-dash-surface/40" : "bg-dash-bg"}`}>
        <span className={colour}>{label}</span> <span className="text-dash-muted/50">({guests.length})</span>
      </div>
      <div className="divide-y divide-dash-border">
        {guests.map((g) => (
          <div key={g.id} className="flex items-center gap-2 px-4 py-2.5">
            <input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => toggleGuestSelection(g.id)} className="accent-dash-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm text-dash-text">
                {(mobileShowUsername ? g.username : g.name) ?? "\u2014"}
                {g.plus_ones > 0 && <span className="ml-1.5 text-xs text-dash-muted">(+1)</span>}
              </span>
              <GuestPhoneNote guest={g} phoneEnabledLinkIds={phoneEnabledLinkIds} />
            </div>
            <span className="shrink-0"><StatusIcon status={statusFor(g.id, activeEventKey)} plusOneLabel={plusOneLabelFor(g.id, activeEventKey)} /></span>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => onEdit(g)} className="text-xs text-dash-primary hover:underline">Edit</button>
              <button onClick={() => onDelete(g)} className="text-xs text-dash-danger hover:underline">Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuestsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editGuest, setEditGuest] = useState<EventGuest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showInvites, setShowInvites] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<EventGuest | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<GuestGroup | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [inviteSubEventId, setInviteSubEventId] = useState<string>("");
  const [inviteTargetGroup, setInviteTargetGroup] = useState<string | null>(null);
  const [bulkGroupId, setBulkGroupId] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const didInitCollapse = useRef(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sortByEvent, setSortByEvent] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [mobileShowUsername, setMobileShowUsername] = useState(false);
  const [mobileActiveEvent, setMobileActiveEvent] = useState<string>("__main__");

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_guests").select("*").eq("event_id", eventId).order("name", { ascending: true }); if (error) throw error; return data as EventGuest[]; },
  });
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("sub_events").select("*").eq("parent_event_id", eventId).order("display_order", { ascending: true }); if (error) throw error; return data as SubEvent[]; },
  });
  const { data: existingInvites } = useQuery({
    queryKey: ["guest-event-invites", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_event_invites").select("guest_id, sub_event_id, invite_type").eq("event_id", eventId); if (error) throw error; return data ?? []; },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("guest_groups").select("*").eq("event_id", eventId).order("sort_order", { ascending: true }); if (error) throw error; return data as GuestGroup[]; },
  });

  const { data: groupEventInvites } = useQuery({
    queryKey: ["group-event-invites", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("group_event_invites").select("*").eq("event_id", eventId); if (error) throw error; return (data ?? []) as GroupEventInvite[]; },
  });

  const { data: openLinks } = useQuery({
    queryKey: ["open-rsvp-links", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("open_rsvp_links").select("*").eq("event_id", eventId); if (error) throw error; return (data ?? []) as OpenRsvpLink[]; },
  });
  const phoneEnabledLinkIds = new Set((openLinks ?? []).filter((l) => (l.page_config as { phoneEnabled?: boolean } | null)?.phoneEnabled).map((l) => l.id));

  const { data: allRsvps } = useQuery({
    queryKey: ["event-rsvps-full", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_rsvps").select("guest_id, sub_event_id, status, plus_ones").eq("event_id", eventId); if (error) throw error; return (data ?? []) as Pick<EventRsvp, "guest_id" | "sub_event_id" | "status" | "plus_ones">[]; },
  });

  useEffect(() => {
    if (didInitCollapse.current) return;
    const keys = new Set<string>();
    for (const gr of (groups ?? [])) keys.add(gr.id);
    if ((guests ?? []).some((g) => !g.group_id)) keys.add(UNGROUPED_KEY);
    if (keys.size > 0) { didInitCollapse.current = true; setCollapsedGroups(keys); }
  }, [groups, guests]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportMenu]);

  // Build a map of invited event keys per guest. "__main__" = Main Event.
  // A guest is invited if they have:
  //   1. A direct guest_event_invites row (invite_type = 'include'), OR
  //   2. A group_event_invites row for their group.
  // No overrides — the overrides table is no longer used.
  const directInvitesByGuest = new Map<string, Set<string>>();
  for (const g of (guests ?? [])) {
    const direct = new Set<string>();
    (existingInvites ?? []).filter((inv) => inv.guest_id === g.id && inv.invite_type === "include").forEach((inv) => {
      if (inv.sub_event_id) direct.add(inv.sub_event_id as string);
      else direct.add("__main__");
    });
    directInvitesByGuest.set(g.id, direct);
  }

  // Group-level invites: map group_id → set of sub_event_ids ("__main__" for Main Event)
  const groupInvitesByGroup = new Map<string, Set<string>>();
  for (const gi of (groupEventInvites ?? [])) {
    let set = groupInvitesByGroup.get(gi.group_id);
    if (!set) { set = new Set(); groupInvitesByGroup.set(gi.group_id, set); }
    set.add(gi.sub_event_id ? gi.sub_event_id : "__main__");
  }

  const invitedEventsByGuest = new Map<string, Set<string>>();
  for (const g of (guests ?? [])) {
    const invited = new Set(directInvitesByGuest.get(g.id) ?? []);
    // Add group-level invites
    if (g.group_id) {
      const giSet = groupInvitesByGroup.get(g.group_id);
      if (giSet) giSet.forEach((key) => invited.add(key));
    }
    invitedEventsByGuest.set(g.id, invited);
  }

  const rsvpStatusByGuest = new Map<string, Map<string, string>>();
  const rsvpPlusOnesByGuest = new Map<string, Map<string, number>>();
  for (const r of (allRsvps ?? [])) {
    let inner = rsvpStatusByGuest.get(r.guest_id);
    if (!inner) { inner = new Map(); rsvpStatusByGuest.set(r.guest_id, inner); }
    const key = r.sub_event_id ?? "__main__";
    inner.set(key, r.status);
    let pInner = rsvpPlusOnesByGuest.get(r.guest_id);
    if (!pInner) { pInner = new Map(); rsvpPlusOnesByGuest.set(r.guest_id, pInner); }
    pInner.set(key, r.plus_ones);
  }

  const statusFor = (guestId: string, tabKey: string): GuestStatus => {
    const invited = invitedEventsByGuest.get(guestId);
    if (!invited || !invited.has(tabKey)) return "not_invited";
    if (tabKey === "__main__") {
      const g = guests?.find((gg) => gg.id === guestId);
      const s = g?.rsvp_status;
      if (s === "attending") return "attending";
      if (s === "declined") return "declined";
      return "pending";
    }
    const rsvpMap = rsvpStatusByGuest.get(guestId);
    const status = rsvpMap?.get(tabKey);
    if (status === "attending") return "attending";
    if (status === "declined") return "declined";
    return "pending";
  };

  const plusOneLabelFor = (guestId: string, tabKey: string): string | null => {
    const g = guests?.find((gg) => gg.id === guestId);
    if (!g) return null;
    const invited = invitedEventsByGuest.get(guestId);
    if (!invited || !invited.has(tabKey)) return null;
    if (tabKey === "__main__") {
      const s = g.rsvp_status;
      if (s !== "attending" && s !== "declined") return null;
      if (!g.allow_plus_one) return null;
      return g.plus_ones > 0 ? "+1" : "0";
    }
    const rsvpMap = rsvpStatusByGuest.get(guestId);
    const status = rsvpMap?.get(tabKey);
    if (status !== "attending" && status !== "declined") return null;
    const pMap = rsvpPlusOnesByGuest.get(guestId);
    const plusOnes = pMap?.get(tabKey) ?? 0;
    if (!g.allow_plus_one) return null;
    return plusOnes > 0 ? "+1" : "0";
  };

  const tabLabel = (se: SubEvent) => se.tab_name?.trim() || (se.name ?? "Untitled");

  const sortedSubEvents = [...(subEvents ?? [])].sort((a, b) => {
    const aDate = a.date ?? "";
    const bDate = b.date ?? "";
    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.localeCompare(bDate);
  });
  const eventColumns: Array<{ key: string; label: string }> = [{ key: "__main__", label: "Main Event" }];
  for (const se of sortedSubEvents) {
    eventColumns.push({ key: se.id, label: tabLabel(se) });
  }

  const sortedGroups = [...(groups ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const groupName = (id: string | null) => sortedGroups.find((g) => g.id === id)?.name ?? null;

  const statusOrder: GuestStatus[] = ["attending", "declined", "pending", "not_invited"];
  const statusRank = (s: GuestStatus) => statusOrder.indexOf(s);
  const statusLabel = (s: GuestStatus) =>
    s === "attending" ? "Attending" : s === "declined" ? "Declined" : s === "pending" ? "Pending" : "Not invited";
  const statusColour = (s: GuestStatus) =>
    s === "attending" ? "text-green-600" : s === "declined" ? "text-red-500" : "text-dash-muted";

  const sortGuests = (gs: EventGuest[]) => {
    const byName = (a: EventGuest, b: EventGuest) => (a.name ?? "").localeCompare(b.name ?? "");
    if (!sortByEvent) return [...gs].sort(byName);
    return [...gs].sort((a, b) => {
      const ra = statusRank(statusFor(a.id, sortByEvent));
      const rb = statusRank(statusFor(b.id, sortByEvent));
      if (ra !== rb) return ra - rb;
      return byName(a, b);
    });
  };

  // Group guests: ordered by group sort_order, then "Ungrouped" last; within each group, alphabetical by name
  const groupedGuests: Array<{ key: string; label: string; guests: EventGuest[] }> = [];
  for (const gr of sortedGroups) {
    const gs = sortGuests((guests ?? []).filter((g) => g.group_id === gr.id));
    if (gs.length > 0) groupedGuests.push({ key: gr.id, label: gr.name, guests: gs });
  }
  const ungrouped = sortGuests((guests ?? []).filter((g) => !g.group_id));
  if (ungrouped.length > 0) groupedGuests.push({ key: UNGROUPED_KEY, label: "Ungrouped", guests: ungrouped });

  const visibleGuests = guests ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_guests").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }),
  });

  const bulkInviteMutation = useMutation({
    mutationFn: async ({ guestIds, groupIds, subEventId }: { guestIds: string[]; groupIds: string[]; subEventId: string | null }) => {
      if (guestIds.length > 0) {
        const rows = guestIds.map((gid) => ({ guest_id: gid, event_id: eventId, sub_event_id: subEventId, invite_type: "include" as const }));
        const { error } = await supabase.from("guest_event_invites").upsert(rows, { onConflict: "guest_id,event_id,sub_event_id" });
        if (error) throw error;
      }
      if (groupIds.length > 0) {
        const rows = groupIds.map((gid) => ({ group_id: gid, event_id: eventId, sub_event_id: subEventId }));
        const { error } = await supabase.from("group_event_invites").upsert(rows, { onConflict: "group_id,event_id,sub_event_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] });
    },
  });

  const bulkRemoveInviteMutation = useMutation({
    mutationFn: async ({ guestIds, groupIds, subEventId }: { guestIds: string[]; groupIds: string[]; subEventId: string | null }) => {
      if (guestIds.length > 0) {
        let query = supabase.from("guest_event_invites").delete().eq("event_id", eventId).in("guest_id", guestIds);
        query = subEventId ? query.eq("sub_event_id", subEventId) : query.is("sub_event_id", null);
        const { error } = await query;
        if (error) throw error;
      }
      if (groupIds.length > 0) {
        let query = supabase.from("group_event_invites").delete().eq("event_id", eventId).in("group_id", groupIds);
        query = subEventId ? query.eq("sub_event_id", subEventId) : query.is("sub_event_id", null);
        const { error } = await query;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] });
    },
  });

  const groupInviteMutation = useMutation({
    mutationFn: async ({ groupId, subEventId }: { groupId: string; subEventId: string | null }) => {
      const { error } = await supabase.from("group_event_invites").upsert(
        { group_id: groupId, event_id: eventId, sub_event_id: subEventId },
        { onConflict: "group_id,event_id,sub_event_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] }); setInviteTargetGroup(null); },
  });

  const groupRemoveInviteMutation = useMutation({
    mutationFn: async ({ groupId, subEventId }: { groupId: string; subEventId: string | null }) => {
      let query = supabase.from("group_event_invites").delete().eq("group_id", groupId).eq("event_id", eventId);
      if (subEventId) query = query.eq("sub_event_id", subEventId); else query = query.is("sub_event_id", null);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] }); setInviteTargetGroup(null); },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      const sortOrder = (groups ?? []).length;
      const { error } = await supabase.from("guest_groups").insert({ event_id: eventId, name, sort_order: sortOrder });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); setNewGroupName(""); },
  });

  const renameGroupMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("guest_groups").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("event_guests").update({ group_id: null }).eq("group_id", id).eq("event_id", eventId);
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] }); queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); },
  });

  const bulkAssignGroupMutation = useMutation({
    mutationFn: async ({ guestIds, groupId }: { guestIds: string[]; groupId: string | null }) => {
      if (guestIds.length === 0) return;
      const { error } = await supabase.from("event_guests").update({ group_id: groupId }).in("id", guestIds);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] }); setSelectedGuestIds(new Set()); setBulkGroupId(""); },
  });

  const toggleGuestSelection = (id: string) => {
    setSelectedGuestIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleGroupTick = (groupId: string) => {
    setSelectedGroupIds((prev) => { const next = new Set(prev); if (next.has(groupId)) next.delete(groupId); else next.add(groupId); return next; });
  };

  const clearSelection = () => { setSelectedGuestIds(new Set()); setSelectedGroupIds(new Set()); };

  const selectionCount = selectedGuestIds.size + selectedGroupIds.size;

  const handleAddOrUpdate = async (values: GuestFormValues) => {
    setSubmitting(true); setFormError(null);
    try {
      let guestId: string;
      if (editGuest) {
        const { error } = await supabase.from("event_guests").update({ name: values.name, username: values.username, group_id: values.groupId || null }).eq("id", editGuest.id);
        if (error) throw error;
        guestId = editGuest.id;
      } else {
        const { data: newGuest, error } = await supabase.from("event_guests").insert({ event_id: eventId, name: values.name, username: values.username || generateUsername(values.name), token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0, group_id: values.groupId || null }).select("id").single();
        if (error) throw error;
        guestId = newGuest.id;
      }

      // Ensure the guest has a Main Event invitation
      await supabase.from("guest_event_invites").upsert(
        { guest_id: guestId, event_id: eventId, sub_event_id: null, invite_type: "include" },
        { onConflict: "guest_id,event_id,sub_event_id" },
      );

      // Sync sub-event invitations via guest_event_invites.
      // Ticked sub-events get a direct invite; unticked ones have their
      // direct invite removed. Group-level invites are managed via
      // Manage Invitations and are not affected here.
      if (subEvents && subEvents.length > 0) {
        const invitedSubEventIds = subEvents.filter((se) => values.eventInvitations[se.id] ?? false).map((se) => se.id);
        // Remove direct invites for unticked sub-events
        const untickedIds = subEvents.filter((se) => !(values.eventInvitations[se.id] ?? false)).map((se) => se.id);
        if (untickedIds.length > 0) {
          await supabase.from("guest_event_invites").delete().eq("guest_id", guestId).eq("event_id", eventId).in("sub_event_id", untickedIds);
        }
        // Add direct invites for ticked sub-events
        if (invitedSubEventIds.length > 0) {
          const rows = invitedSubEventIds.map((sid) => ({ guest_id: guestId, event_id: eventId, sub_event_id: sid, invite_type: "include" as const }));
          const { error: inviteError } = await supabase.from("guest_event_invites").upsert(rows, { onConflict: "guest_id,event_id,sub_event_id" });
          if (inviteError) throw inviteError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] });
      setShowForm(false); setEditGuest(null);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Failed to save guest"); }
    finally { setSubmitting(false); }
  };

  const exportGuestCsv = (guestList: EventGuest[], filename: string) => {
    const headers = ["Name", "Username", "Phone", "Group"];
    for (const col of eventColumns) headers.push(col.label);
    headers.push("Plus-one");
    const rows: string[][] = [];
    for (const g of guestList) {
      const phone = g.open_rsvp_link_id ? (g.phone?.trim() ?? "") : "";
      const row = [g.name ?? "", g.username ?? "", phone, groupName(g.group_id) ?? "Ungrouped"];
      for (const col of eventColumns) {
        const s = statusFor(g.id, col.key);
        row.push(s === "attending" ? "Attending" : s === "declined" ? "Declined" : s === "pending" ? "Pending" : "Not invited");
      }
      row.push(plusOneLabelFor(g.id, "__main__") ?? "");
      rows.push(row);
    }
    const escapeCell = (s: string) => (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s.replace(/"/g, '""')}"` : s;
    const csv = [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load guests" message={error instanceof Error ? error.message : "Unknown error"} />;

  const invitedKeysForTargetGroup = inviteTargetGroup ? (groupInvitesByGroup.get(inviteTargetGroup) ?? new Set<string>()) : new Set<string>();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowBulkImport(true)}>Bulk Import</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowGroups(true)}>Manage Groups</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowInvites(true)} disabled={!guests || guests.length === 0}>Manage Invitations</Button>
          <div className="relative" ref={exportRef}>
            <Button size="sm" variant="secondary" onClick={() => setShowExportMenu((v) => !v)} disabled={!guests || guests.length === 0}>Export</Button>
            {showExportMenu && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-dash-border bg-dash-surface shadow-lg">
                <button onClick={() => exportGuestCsv(guests ?? [], "guests-all.csv")} className="block w-full px-4 py-2 text-left text-sm text-dash-text hover:bg-dash-bg">All guests</button>
                {sortedGroups.filter((gr) => (guests ?? []).some((g) => g.group_id === gr.id)).map((gr) => (
                  <button key={gr.id} onClick={() => exportGuestCsv((guests ?? []).filter((g) => g.group_id === gr.id), `guests-${slugify(gr.name)}.csv`)} className="block w-full px-4 py-2 text-left text-sm text-dash-text hover:bg-dash-bg">{gr.name}</button>
                ))}
                {(guests ?? []).filter((g) => !g.group_id).length > 0 && (
                  <button onClick={() => exportGuestCsv((guests ?? []).filter((g) => !g.group_id), "guests-ungrouped.csv")} className="block w-full px-4 py-2 text-left text-sm text-dash-text hover:bg-dash-bg">Ungrouped</button>
                )}
              </div>
            )}
          </div>
          <Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button>
        </div>
      </div>

      {!guests || guests.length === 0 ? (
        <EmptyState title="No guests yet" description="Add guests to invite them to your event." action={<Button size="sm" onClick={() => { setEditGuest(null); setShowForm(true); }}>Add Guest</Button>} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dash-muted">
            <span className="inline-flex items-center gap-1"><span className="text-green-600 font-bold">&#10003;</span> Attending</span>
            <span className="inline-flex items-center gap-1"><span className="text-red-500 font-bold">&#10007;</span> Declined</span>
            <span className="inline-flex items-center gap-1"><span className="font-bold">=</span> Pending</span>
            <span className="inline-flex items-center gap-1"><span>&mdash;</span> Not invited</span>
            <span className="inline-flex items-center gap-1"><span className="text-green-600 font-semibold">+1</span>/<span className="text-dash-muted font-semibold">0</span> Plus-one</span>
          </div>

          {/* Mobile-only controls: Name/Username toggle + active event selector */}
          <div className="flex flex-col gap-2 sm:hidden">
            <div className="flex rounded-lg border border-dash-border bg-dash-bg p-0.5">
              <button onClick={() => setMobileShowUsername(false)} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${!mobileShowUsername ? "bg-dash-surface text-dash-text shadow-sm" : "text-dash-muted"}`}>Name</button>
              <button onClick={() => setMobileShowUsername(true)} className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mobileShowUsername ? "bg-dash-surface text-dash-text shadow-sm" : "text-dash-muted"}`}>Username</button>
            </div>
            <select value={mobileActiveEvent} onChange={(e) => setMobileActiveEvent(e.target.value)} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text">
              {eventColumns.map((col) => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>

          {selectionCount > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-dash-muted">
                  {[selectedGroupIds.size > 0 ? `${selectedGroupIds.size} ${selectedGroupIds.size === 1 ? "group" : "groups"}` : null, selectedGuestIds.size > 0 ? `${selectedGuestIds.size} ${selectedGuestIds.size === 1 ? "guest" : "guests"}` : null].filter(Boolean).join(", ")} selected
                </span>
                <button onClick={clearSelection} className="text-xs text-dash-primary hover:underline">Clear</button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <select value={inviteSubEventId} onChange={(e) => setInviteSubEventId(e.target.value)} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text sm:w-auto sm:min-w-[160px]">
                  <option value="">Main Event</option>
                  {sortedSubEvents.map((se) => <option key={se.id} value={se.id}>{se.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => bulkInviteMutation.mutate({ guestIds: [...selectedGuestIds], groupIds: [...selectedGroupIds], subEventId: inviteSubEventId || null })} loading={bulkInviteMutation.isPending}>Invite</Button>
                  <Button size="sm" variant="secondary" onClick={() => bulkRemoveInviteMutation.mutate({ guestIds: [...selectedGuestIds], groupIds: [...selectedGroupIds], subEventId: inviteSubEventId || null })} loading={bulkRemoveInviteMutation.isPending}>Remove</Button>
                </div>
              </div>
              {selectedGuestIds.size > 0 && sortedGroups.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select value={bulkGroupId} onChange={(e) => setBulkGroupId(e.target.value)} className="w-full flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text">
                    <option value="">Assign selected guests to group…</option>
                    <option value={UNGROUPED_KEY}>Ungrouped</option>
                    {sortedGroups.map((gr) => <option key={gr.id} value={gr.id}>{gr.name}</option>)}
                  </select>
                  <Button size="sm" onClick={() => bulkAssignGroupMutation.mutate({ guestIds: [...selectedGuestIds], groupId: bulkGroupId === UNGROUPED_KEY ? null : bulkGroupId || null })} disabled={!bulkGroupId} loading={bulkAssignGroupMutation.isPending}>Assign</Button>
                </div>
              )}
              {(bulkInviteMutation.isError || bulkRemoveInviteMutation.isError) && (
                <p className="text-xs text-dash-danger">Something went wrong. Please try again.</p>
              )}
            </div>
          )}

          {/* Mobile: compact two-column list (checkbox, name/username, status, actions) */}
          <div className="space-y-2 sm:hidden">
            {groupedGuests.length === 0 ? (
              (() => {
                const allSorted = sortGuests(guests ?? []);
                const blocks: Array<{ status: GuestStatus; guests: EventGuest[] }> = [];
                for (const st of statusOrder) {
                  const bucket = allSorted.filter((g) => statusFor(g.id, mobileActiveEvent) === st);
                  if (bucket.length > 0) blocks.push({ status: st, guests: bucket });
                }
                if (blocks.length === 0) return <p className="text-sm text-dash-muted py-4 text-center">No guests found.</p>;
                return blocks.map((blk, bi) => (
                  <MobileGuestSection key={`mblk-${bi}`} status={blk.status} label={statusLabel(blk.status)} colour={statusColour(blk.status)} guests={blk.guests} selectedGuestIds={selectedGuestIds} toggleGuestSelection={toggleGuestSelection} mobileShowUsername={mobileShowUsername} activeEventKey={mobileActiveEvent} statusFor={statusFor} plusOneLabelFor={plusOneLabelFor} phoneEnabledLinkIds={phoneEnabledLinkIds} onEdit={(g) => { setEditGuest(g); setShowForm(true); }} onDelete={(g) => setGuestToDelete(g)} />
                ));
              })()
            ) : (
              groupedGuests.map((section) => (
                <div key={`msec-${section.key}`} className="rounded-lg border border-dash-border bg-dash-surface overflow-hidden">
                  <div className="flex w-full items-center gap-3 bg-dash-bg px-4 py-2.5">
                    {section.key !== UNGROUPED_KEY && (
                      <GroupTick checked={selectedGroupIds.has(section.key)} label={section.label} onToggle={() => toggleGroupTick(section.key)} />
                    )}
                    <button onClick={() => toggleGroupCollapse(section.key)} className="flex min-w-0 flex-1 items-center justify-between text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-dash-text">
                        <span className="mr-1.5 inline-block w-3 text-dash-muted">{collapsedGroups.has(section.key) ? "\u25B6" : "\u25BC"}</span>
                        {section.label} <span className="ml-1 text-dash-muted">({section.guests.length})</span>
                      </span>
                    </button>
                  </div>

                  {!collapsedGroups.has(section.key) && (
                    <div className="divide-y divide-dash-border">
                      {(() => {
                        const blocks: Array<{ status: GuestStatus; guests: EventGuest[] }> = [];
                        for (const st of statusOrder) {
                          const bucket = section.guests.filter((g) => statusFor(g.id, mobileActiveEvent) === st);
                          if (bucket.length > 0) blocks.push({ status: st, guests: bucket });
                        }
                        if (blocks.length === 0) return <p className="px-4 py-3 text-sm text-dash-muted">No guests.</p>;
                        return blocks.map((blk, bi) => (
                          <MobileGuestSection key={`mblk-${section.key}-${bi}`} status={blk.status} label={statusLabel(blk.status)} colour={statusColour(blk.status)} guests={blk.guests} selectedGuestIds={selectedGuestIds} toggleGuestSelection={toggleGuestSelection} mobileShowUsername={mobileShowUsername} activeEventKey={mobileActiveEvent} statusFor={statusFor} plusOneLabelFor={plusOneLabelFor} phoneEnabledLinkIds={phoneEnabledLinkIds} onEdit={(g) => { setEditGuest(g); setShowForm(true); }} onDelete={(g) => setGuestToDelete(g)} embedded />
                        ));
                      })()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop/tablet: full multi-column table (hidden on phones) */}
          <div className="hidden overflow-x-auto rounded-lg border border-dash-border sm:block">
            <table className="w-full">
              <thead className="bg-dash-bg">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">
                    <input type="checkbox" checked={selectedGuestIds.size === visibleGuests.length && visibleGuests.length > 0} onChange={(e) => setSelectedGuestIds(e.target.checked ? new Set(visibleGuests.map((g) => g.id)) : new Set())} className="accent-dash-primary" />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Username</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-dash-muted">Group</th>
                  {eventColumns.length > 0 ? (
                    eventColumns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => setSortByEvent((prev) => (prev === col.key ? null : col.key))}
                        className={`px-4 py-2 text-center text-xs font-medium whitespace-nowrap cursor-pointer select-none transition-colors ${
                          sortByEvent === col.key ? "text-dash-primary bg-dash-surface/60" : "text-dash-muted hover:text-dash-text"
                        }`}
                        title={sortByEvent === col.key ? "Click to stop grouping by RSVP status" : "Click to group guests within each group by their RSVP status for this event"}
                      >
                        {col.label}
                        {sortByEvent === col.key && <span className="ml-1">&#9650;</span>}
                      </th>
                    ))
                  ) : (
                    <th className="px-4 py-2 text-center text-xs font-medium text-dash-muted">Status</th>
                  )}
                  <th className="px-4 py-2 text-right text-xs font-medium text-dash-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dash-border bg-dash-surface">
                {groupedGuests.length === 0 ? (
                  (() => {
                    const allSorted = sortGuests(guests ?? []);
                    const rows: React.ReactNode[] = [];
                    const blocks: Array<{ status: GuestStatus; guests: EventGuest[] }> = [];
                    for (const st of statusOrder) {
                      const bucket = allSorted.filter((g) => statusFor(g.id, sortByEvent ?? "__main__") === st);
                      if (bucket.length > 0) blocks.push({ status: st, guests: bucket });
                    }
                    blocks.forEach((blk, bi) => {
                      rows.push(
                        <tr key={`sub-${bi}`} className="bg-dash-surface/40">
                          <td colSpan={eventColumns.length > 0 ? eventColumns.length + 5 : 6} className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-dash-muted/70">
                            <span className={statusColour(blk.status)}>{statusLabel(blk.status)}</span> <span className="text-dash-muted/50">({blk.guests.length})</span>
                          </td>
                        </tr>,
                      );
                      blk.guests.map((g) => (
                        <tr key={g.id}>
                          <td className="px-4 py-2"><input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => toggleGuestSelection(g.id)} className="accent-dash-primary" /></td>
                          <td className="px-4 py-2 text-sm text-dash-text">{g.name}{g.plus_ones > 0 && <span className="ml-1.5 text-xs text-dash-muted">(+1)</span>}<GuestPhoneNote guest={g} phoneEnabledLinkIds={phoneEnabledLinkIds} /></td>
                          <td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "\u2014"}</td>
                          <td className="px-4 py-2 text-sm text-dash-muted">{"\u2014"}</td>
                          <td className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, "__main__")} plusOneLabel={plusOneLabelFor(g.id, "__main__")} /></td>
                          <td className="px-4 py-2 text-right">
                            <button onClick={() => { setEditGuest(g); setShowForm(true); }} className="mr-2 text-xs text-dash-primary hover:underline">Edit</button>
                            <button onClick={() => setGuestToDelete(g)} className="text-xs text-dash-danger hover:underline">Delete</button>
                          </td>
                        </tr>
                      )).forEach((r) => rows.push(r));
                    });
                    return rows;
                  })()
                ) : (
                  groupedGuests.flatMap((section) => {
                    const rows: React.ReactNode[] = [];
                    rows.push(
                      <tr key={`sep-${section.key}`} onClick={() => toggleGroupCollapse(section.key)} className="cursor-pointer hover:bg-dash-surface/60">
                        <td colSpan={eventColumns.length > 0 ? eventColumns.length + 5 : 6} className="bg-dash-bg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-dash-text">
                          <div className="flex items-center gap-3">
                            {section.key !== UNGROUPED_KEY && (
                              <GroupTick checked={selectedGroupIds.has(section.key)} label={section.label} onToggle={() => toggleGroupTick(section.key)} />
                            )}
                            <span>
                              <span className="mr-1.5 inline-block w-3 text-dash-muted">{collapsedGroups.has(section.key) ? "\u25B6" : "\u25BC"}</span>
                              {section.label} <span className="ml-1 text-dash-muted">({section.guests.length})</span>
                            </span>
                          </div>
                        </td>
                      </tr>,
                    );
                    if (collapsedGroups.has(section.key)) return rows;
                    // Group this section's guests into status blocks (always shown, faint)
                    const blocks: Array<{ status: GuestStatus; guests: EventGuest[] }> = [];
                    for (const st of statusOrder) {
                      const bucket = section.guests.filter((g) => statusFor(g.id, sortByEvent ?? "__main__") === st);
                      if (bucket.length > 0) blocks.push({ status: st, guests: bucket });
                    }
                    blocks.forEach((blk, bi) => {
                      rows.push(
                        <tr key={`sub-${section.key}-${bi}`} className="bg-dash-surface/40">
                          <td colSpan={eventColumns.length > 0 ? eventColumns.length + 5 : 6} className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-dash-muted/70">
                            <span className={statusColour(blk.status)}>{statusLabel(blk.status)}</span> <span className="text-dash-muted/50">({blk.guests.length})</span>
                          </td>
                        </tr>,
                      );
                      blk.guests.forEach((g) => {
                        rows.push(
                          <tr key={g.id}>
                            <td className="px-4 py-2"><input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => toggleGuestSelection(g.id)} className="accent-dash-primary" /></td>
                            <td className="px-4 py-2 text-sm text-dash-text">{g.name}{g.plus_ones > 0 && <span className="ml-1.5 text-xs text-dash-muted">(+1)</span>}<GuestPhoneNote guest={g} phoneEnabledLinkIds={phoneEnabledLinkIds} /></td>
                            <td className="px-4 py-2 text-sm text-dash-muted">{g.username ?? "\u2014"}</td>
                            <td className="px-4 py-2 text-sm text-dash-muted">{groupName(g.group_id) ?? "\u2014"}</td>
                            {eventColumns.length > 0 ? (
                              eventColumns.map((col) => (
                                <td key={col.key} className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, col.key)} plusOneLabel={plusOneLabelFor(g.id, col.key)} /></td>
                              ))
                            ) : (
                              <td className="px-4 py-2 text-center"><StatusIcon status={statusFor(g.id, "__main__")} plusOneLabel={plusOneLabelFor(g.id, "__main__")} /></td>
                            )}
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => { setEditGuest(g); setShowForm(true); }} className="mr-2 text-xs text-dash-primary hover:underline">Edit</button>
                              <button onClick={() => setGuestToDelete(g)} className="text-xs text-dash-danger hover:underline">Delete</button>
                            </td>
                          </tr>,
                        );
                      });
                    });
                    return rows;
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditGuest(null); setFormError(null); }} title={editGuest ? "Edit Guest" : "Add Guest"}>
        {formError && <p className="mb-3 text-sm text-dash-danger">{formError}</p>}
        <GuestForm
          eventId={eventId}
          guest={editGuest}
          subEvents={sortedSubEvents}
          groups={sortedGroups}
          existingInvitations={editGuest ? Object.fromEntries([...(directInvitesByGuest.get(editGuest.id) ?? [])].map((id) => [id, true])) : undefined}
          onSubmit={handleAddOrUpdate}
          onCancel={() => { setShowForm(false); setEditGuest(null); setFormError(null); }}
          submitting={submitting}
        />
      </Modal>

      <Modal open={showInvites} onClose={() => setShowInvites(false)} title="Manage Invitations">
        <div className="space-y-6">
          {sortedGroups.length > 0 && (
            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-dash-text">Group invitations</h4>
                <p className="mt-0.5 text-xs text-dash-muted">Invite a whole group to an event. Every member inherits the invitation.</p>
              </div>
              <ul className="space-y-2">
                {sortedGroups.map((gr) => {
                  const memberCount = (guests ?? []).filter((g) => g.group_id === gr.id).length;
                  const invitedKeys = groupInvitesByGroup.get(gr.id) ?? new Set<string>();
                  const isOpen = inviteTargetGroup === gr.id;
                  return (
                    <li key={gr.id} className={`overflow-hidden rounded-lg border ${isOpen ? "border-dash-primary" : "border-dash-border"}`}>
                      <button type="button" onClick={() => setInviteTargetGroup(isOpen ? null : gr.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-3 bg-dash-bg px-3 py-2.5 text-left transition-colors hover:bg-dash-surface">
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-dash-text">{gr.name}</span>
                          <span className="text-xs text-dash-muted">{memberCount} {memberCount === 1 ? "guest" : "guests"}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="flex flex-wrap justify-end gap-1">
                            {eventColumns.filter((col) => invitedKeys.has(col.key)).map((col) => (
                              <span key={col.key} className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">{col.label}</span>
                            ))}
                          </div>
                          <svg className={`h-4 w-4 text-dash-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </button>
                      {isOpen && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-dash-border bg-dash-surface px-3 py-3">
                          <select value={inviteSubEventId} onChange={(e) => setInviteSubEventId(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-1.5 text-sm text-dash-text">
                            <option value="">{`Main Event${invitedKeysForTargetGroup.has("__main__") ? " (invited)" : ""}`}</option>
                            {sortedSubEvents.map((se) => <option key={se.id} value={se.id}>{`${se.name}${invitedKeysForTargetGroup.has(se.id) ? " (invited)" : ""}`}</option>)}
                          </select>
                          <Button size="sm" onClick={() => groupInviteMutation.mutate({ groupId: gr.id, subEventId: inviteSubEventId || null })} loading={groupInviteMutation.isPending}>Invite group</Button>
                          <Button size="sm" variant="secondary" onClick={() => groupRemoveInviteMutation.mutate({ groupId: gr.id, subEventId: inviteSubEventId || null })} loading={groupRemoveInviteMutation.isPending}>Remove group</Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {groupInviteMutation.isError && <p className="text-xs text-dash-danger">{groupInviteMutation.error instanceof Error ? groupInviteMutation.error.message : "Failed to invite group"}</p>}
              {groupInviteMutation.isSuccess && <p className="text-xs text-green-600">Group invited.</p>}
              {groupRemoveInviteMutation.isError && <p className="text-xs text-dash-danger">{groupRemoveInviteMutation.error instanceof Error ? groupRemoveInviteMutation.error.message : "Failed to remove group"}</p>}
              {groupRemoveInviteMutation.isSuccess && <p className="text-xs text-green-600">Group invitation removed.</p>}
            </section>
          )}

        </div>
      </Modal>

      <Modal open={showGroups} onClose={() => { setShowGroups(false); setNewGroupName(""); }} title="Manage Groups">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="New group name" className="flex-1 rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text" />
            <Button size="sm" onClick={() => createGroupMutation.mutate(newGroupName.trim())} disabled={!newGroupName.trim()} loading={createGroupMutation.isPending}>Add</Button>
          </div>

          {sortedGroups.length > 0 && (
            <div className="space-y-3 border-t border-dash-border pt-3">
              {sortedGroups.map((gr) => (
                <div key={gr.id} className="space-y-2 rounded-lg border border-dash-border bg-dash-bg p-3">
                  <div className="flex items-center gap-2">
                    <input defaultValue={gr.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== gr.name) renameGroupMutation.mutate({ id: gr.id, name: v }); }} className="flex-1 rounded border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text" />
                    <button onClick={() => setGroupToDelete(gr)} className="text-xs text-dash-danger hover:underline" title="Delete group (guests become ungrouped)">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sortedGroups.length === 0 && (
            <p className="text-sm text-dash-muted">No groups yet. Create one above to start grouping your guests. Use Manage Invitations to invite groups to events.</p>
          )}
        </div>
      </Modal>

      <Modal open={!!guestToDelete} onClose={() => setGuestToDelete(null)} title="Delete guest?">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">Are you sure you want to delete <span className="font-semibold">{guestToDelete?.name ?? "this guest"}</span>? This cannot be undone, and any RSVP responses for this guest will also be removed.</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setGuestToDelete(null)}>Cancel</Button>
            <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => { if (guestToDelete) { deleteMutation.mutate(guestToDelete.id, { onSuccess: () => setGuestToDelete(null) }); } }}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!groupToDelete} onClose={() => setGroupToDelete(null)} title="Delete group?">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">Are you sure you want to delete the group <span className="font-semibold">{groupToDelete?.name ?? ""}</span>? The guests in this group will not be deleted, but they will become ungrouped.</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setGroupToDelete(null)}>Cancel</Button>
            <Button size="sm" variant="danger" loading={deleteGroupMutation.isPending} onClick={() => { if (groupToDelete) { deleteGroupMutation.mutate(groupToDelete.id, { onSuccess: () => setGroupToDelete(null) }); } }}>Delete</Button>
          </div>
        </div>
      </Modal>

      <BulkImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        existingUsernames={new Set((guests ?? []).map((g) => (g.username ?? "").toLowerCase()).filter(Boolean))}
        groups={(groups ?? []).map((g) => ({ id: g.id, name: g.name }))}
        onImport={async (importGuests) => {
          let imported = 0;
          let failed = 0;
          const errors: string[] = [];
          const insertedIds: string[] = [];
          for (const g of importGuests) {
            const { data: newGuest, error: insertError } = await supabase
              .from("event_guests")
              .insert({ event_id: eventId, name: g.name, username: g.username, token: crypto.randomUUID(), rsvp_status: "pending", plus_ones: 0, group_id: g.groupId })
              .select("id")
              .maybeSingle();
            if (insertError || !newGuest) {
              failed++;
              const reason = insertError?.message ?? "Unknown error";
              errors.push(`${g.name}: ${reason}`);
            } else {
              imported++;
              insertedIds.push(newGuest.id);
            }
          }
          // Give every successfully imported guest a Main Event invitation
          if (insertedIds.length > 0) {
            const inviteRows = insertedIds.map((id) => ({ guest_id: id, event_id: eventId, sub_event_id: null, invite_type: "include" as const }));
            await supabase.from("guest_event_invites").upsert(inviteRows, { onConflict: "guest_id,event_id,sub_event_id" });
          }
          queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
          queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] });
          return { imported, failed, errors };
        }}
      />
    </div>
  );
}
