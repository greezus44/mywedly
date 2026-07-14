import React from "react";
import { Input, Select, Badge } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import type { EventGuest, GuestGroup } from "../../lib/supabase";
import { generateUsername } from "../../lib/utils";

export interface GuestFormState {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string;
  side: string;
  rsvp_status: string;
  plus_ones: number;
  dietary: string;
  message: string;
  table_number: string;
}

export function guestToForm(guest: EventGuest): GuestFormState {
  return {
    name: guest.name ?? "",
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_id: guest.group_id ?? "",
    side: guest.side ?? "",
    rsvp_status: guest.rsvp_status ?? "pending",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
    table_number: guest.table_number ?? "",
  };
}

export function emptyGuestForm(): GuestFormState {
  return {
    name: "",
    username: "",
    email: "",
    phone: "",
    group_id: "",
    side: "",
    rsvp_status: "pending",
    plus_ones: 0,
    dietary: "",
    message: "",
    table_number: "",
  };
}

export const SIDES = ["", "Bride", "Groom", "Both", "Other"];

export const RSVP_STATUSES = ["pending", "yes", "no", "maybe"];

export interface RsvpBadgeProps {
  status: string;
}

export function RsvpBadge({ status }: RsvpBadgeProps) {
  const variant =
    status === "yes"
      ? "success"
      : status === "no"
      ? "danger"
      : status === "maybe"
      ? "warning"
      : "default";
  return <Badge variant={variant as "success" | "danger" | "warning" | "default"}>{status}</Badge>;
}

export interface GuestFormProps {
  form: GuestFormState;
  setForm: (form: GuestFormState) => void;
  groups: GuestGroup[];
  usernameError?: string | null;
  onAutoUsername?: () => void;
}

export function GuestForm({
  form,
  setForm,
  groups,
  usernameError,
  onAutoUsername,
}: GuestFormProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="e.g. John Smith"
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-dash-text">
          Username
        </label>
        <div className="flex gap-2">
          <Input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="auto-generated"
            error={usernameError ?? undefined}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAutoUsername}
          >
            Auto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="guest@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+1 555-000-0000"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Group"
          value={form.group_id}
          onChange={(e) => setForm({ ...form, group_id: e.target.value })}
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <Select
          label="Side"
          value={form.side}
          onChange={(e) => setForm({ ...form, side: e.target.value })}
        >
          {SIDES.map((s) => (
            <option key={s} value={s}>
              {s || "—"}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="RSVP Status"
          value={form.rsvp_status}
          onChange={(e) => setForm({ ...form, rsvp_status: e.target.value })}
        >
          {RSVP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input
          label="Plus Ones"
          type="number"
          min={0}
          value={form.plus_ones}
          onChange={(e) =>
            setForm({ ...form, plus_ones: parseInt(e.target.value) || 0 })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Table Number"
          value={form.table_number}
          onChange={(e) => setForm({ ...form, table_number: e.target.value })}
          placeholder="e.g. Table 1"
        />
        <Input
          label="Dietary Restrictions"
          value={form.dietary}
          onChange={(e) => setForm({ ...form, dietary: e.target.value })}
          placeholder="e.g. Vegetarian, Nut allergy"
        />
      </div>

      <Input
        label="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        placeholder="Optional message from guest"
      />
    </div>
  );
}

export { generateUsername };
