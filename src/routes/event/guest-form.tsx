import React from "react";
import type { EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  username: string;
  group_id: string;
  group_name: string;
  side: string;
  plus_ones: number;
  dietary: string;
  message: string;
  table_number: string;
  rsvp_status: string;
}

export function guestToForm(guest: EventGuest): GuestFormData {
  return {
    name: guest.name ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    username: guest.username ?? "",
    group_id: guest.group_id ?? "",
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
    table_number: guest.table_number?.toString() ?? "",
    rsvp_status: guest.rsvp_status ?? "pending",
  };
}

export function formToGuest(form: GuestFormData): Record<string, unknown> {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    username: form.username.trim() || null,
    group_id: form.group_id || null,
    group_name: form.group_name.trim() || null,
    side: form.side || null,
    plus_ones: form.plus_ones ?? 0,
    dietary: form.dietary.trim() || null,
    message: form.message.trim() || null,
    table_number: form.table_number.trim() || null,
    rsvp_status: form.rsvp_status || "pending",
  };
}

export function RsvpBadge({ status }: { status: string }) {
  const variant: "success" | "danger" | "warning" | "default" =
    status === "attending"
      ? "success"
      : status === "declined"
        ? "danger"
        : status === "pending"
          ? "warning"
          : "default";
  return <Badge variant={variant}>{status || "pending"}</Badge>;
}

interface GuestFormProps {
  form: GuestFormData;
  onChange: (form: GuestFormData) => void;
  groups?: { id: string; name: string }[];
  subEvents?: { id: string; name: string }[];
  invitedEventIds?: Set<string>;
  onToggleInvitedEvent?: (eventId: string) => void;
}

export function GuestForm({
  form,
  onChange,
  groups,
  subEvents,
  invitedEventIds,
  onToggleInvitedEvent,
}: GuestFormProps) {
  const update = (patch: Partial<GuestFormData>) => onChange({ ...form, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Name <span className="text-dash-danger">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Guest name"
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="guest@example.com"
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="Phone number"
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => update({ username: e.target.value })}
            placeholder="Auto-generated if empty"
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Guest Group
          </label>
          <select
            value={form.group_id}
            onChange={(e) => {
              const group = groups?.find((g) => g.id === e.target.value);
              update({
                group_id: e.target.value,
                group_name: group?.name ?? "",
              });
            }}
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          >
            <option value="">No group</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Side
          </label>
          <select
            value={form.side}
            onChange={(e) => update({ side: e.target.value })}
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          >
            <option value="">No side</option>
            <option value="bride">Bride's side</option>
            <option value="groom">Groom's side</option>
            <option value="both">Both</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Plus Ones
          </label>
          <input
            type="number"
            min={0}
            value={form.plus_ones}
            onChange={(e) => update({ plus_ones: Number(e.target.value) })}
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Table Number
          </label>
          <input
            type="text"
            value={form.table_number}
            onChange={(e) => update({ table_number: e.target.value })}
            placeholder="e.g. 5"
            className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          Dietary Requirements
        </label>
        <textarea
          value={form.dietary}
          onChange={(e) => update({ dietary: e.target.value })}
          placeholder="Any dietary needs"
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary min-h-[60px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          Message
        </label>
        <textarea
          value={form.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Optional message"
          className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary min-h-[60px]"
        />
      </div>

      {/* Invited Events as clickable chips */}
      {subEvents && subEvents.length > 0 && onToggleInvitedEvent && (
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1.5">
            Invited Events
          </label>
          <p className="text-xs text-dash-muted mb-2">
            Click to toggle which events this guest is invited to.
          </p>
          <div className="flex flex-wrap gap-2">
            {subEvents.map((se) => {
              const isInvited = invitedEventIds?.has(se.id) ?? true;
              return (
                <button
                  key={se.id}
                  type="button"
                  onClick={() => onToggleInvitedEvent(se.id)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full border transition-colors",
                    isInvited
                      ? "bg-dash-primary text-dash-primary-fg border-transparent"
                      : "bg-dash-surface text-dash-text border-dash-border hover:bg-dash-bg",
                  )}
                >
                  {se.name}
                  {isInvited && <span className="ml-1.5">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
