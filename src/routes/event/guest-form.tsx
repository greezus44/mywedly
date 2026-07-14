import React from "react";
import { cn } from "../../lib/utils";
import type { EventGuest } from "../../lib/supabase";

export interface GuestFormValues {
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  group_name: string | null;
  side: string | null;
  group_id: string | null;
  rsvp_status: string;
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  table_number: number | null;
}

export function guestToForm(guest: EventGuest): GuestFormValues {
  return {
    name: guest.name,
    username: guest.username,
    email: guest.email,
    phone: guest.phone,
    group_name: guest.group_name,
    side: guest.side,
    group_id: guest.group_id,
    rsvp_status: guest.rsvp_status,
    plus_ones: guest.plus_ones,
    dietary: guest.dietary,
    message: guest.message,
    table_number: guest.table_number,
  };
}

export const EMPTY_GUEST_FORM: GuestFormValues = {
  name: "",
  username: null,
  email: null,
  phone: null,
  group_name: null,
  side: null,
  group_id: null,
  rsvp_status: "pending",
  plus_ones: 0,
  dietary: null,
  message: null,
  table_number: null,
};

export const RSVP_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "attending", label: "Attending" },
  { value: "declined", label: "Declined" },
];

export const SIDE_OPTIONS = [
  { value: "", label: "None" },
  { value: "bride", label: "Bride's side" },
  { value: "groom", label: "Groom's side" },
  { value: "both", label: "Both" },
  { value: "other", label: "Other" },
];

export interface RsvpBadgeProps {
  status: string;
  className?: string;
}

const badgeStyles: Record<string, string> = {
  attending: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export const RsvpBadge: React.FC<RsvpBadgeProps> = ({ status, className }) => {
  const style = badgeStyles[status] ?? badgeStyles.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        style,
        className,
      )}
    >
      {status || "pending"}
    </span>
  );
};

export interface GuestFormProps {
  values: GuestFormValues;
  onChange: (values: GuestFormValues) => void;
  groups?: { id: string; name: string }[];
}

export const GuestForm: React.FC<GuestFormProps> = ({ values, onChange, groups }) => {
  const update = <K extends keyof GuestFormValues>(key: K, value: GuestFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">
          Name <span className="text-dash-danger">*</span>
        </label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
          placeholder="Jane Doe"
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Username</label>
          <input
            type="text"
            value={values.username ?? ""}
            onChange={(e) => update("username", e.target.value || null)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            placeholder="jane.doe"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Email</label>
          <input
            type="email"
            value={values.email ?? ""}
            onChange={(e) => update("email", e.target.value || null)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Phone</label>
          <input
            type="tel"
            value={values.phone ?? ""}
            onChange={(e) => update("phone", e.target.value || null)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            placeholder="+1 555 000 0000"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Group</label>
          <select
            value={values.group_id ?? ""}
            onChange={(e) => update("group_id", e.target.value || null)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
          >
            <option value="">No group</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Side</label>
          <select
            value={values.side ?? ""}
            onChange={(e) => update("side", e.target.value || null)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
          >
            {SIDE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">RSVP Status</label>
          <select
            value={values.rsvp_status}
            onChange={(e) => update("rsvp_status", e.target.value)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
          >
            {RSVP_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Plus ones</label>
          <input
            type="number"
            min={0}
            value={values.plus_ones}
            onChange={(e) => update("plus_ones", parseInt(e.target.value) || 0)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Table number</label>
          <input
            type="number"
            min={0}
            value={values.table_number ?? ""}
            onChange={(e) => update("table_number", e.target.value ? parseInt(e.target.value) : null)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            placeholder="e.g. 5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-dash-text">Dietary</label>
          <input
            type="text"
            value={values.dietary ?? ""}
            onChange={(e) => update("dietary", e.target.value || null)}
            className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            placeholder="Vegetarian, gluten-free..."
          />
        </div>
      </div>
    </div>
  );
};
