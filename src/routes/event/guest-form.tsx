import { cn } from "../../lib/utils";
import { Input, Select } from "../../components/ui";
import type { EventGuest } from "../../lib/supabase";

export const SIDES = ["", "Bride", "Groom", "Family", "Friend", "Other"] as const;

export const RSVP_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "maybe",
  "attending",
  "not_attending",
] as const;

export interface GuestFormFields {
  name: string;
  email: string;
  phone: string;
  username: string;
  side: string;
  group_id: string;
  group_name: string;
  guest_count: string;
  plus_one_allowed: boolean;
  dietary_notes: string;
  table_number: string;
}

export const EMPTY_GUEST_FORM: GuestFormFields = {
  name: "",
  email: "",
  phone: "",
  username: "",
  side: "",
  group_id: "",
  group_name: "",
  guest_count: "1",
  plus_one_allowed: false,
  dietary_notes: "",
  table_number: "",
};

export function guestToForm(guest: EventGuest): GuestFormFields {
  const g = guest as unknown as Record<string, unknown>;
  return {
    name: guest.name ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    username: (g.username as string) ?? "",
    side: (g.side as string) ?? "",
    group_id: (g.group_id as string) ?? "",
    group_name: (g.group_name as string) ?? "",
    guest_count: String(guest.guest_count ?? 1),
    plus_one_allowed: guest.plus_one_allowed ?? false,
    dietary_notes: guest.dietary_notes ?? "",
    table_number: (g.table_number as string) ?? "",
  };
}

interface RsvpBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function RsvpBadge({ status, className }: RsvpBadgeProps) {
  const s = (status ?? "pending").toLowerCase();
  const variants: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-green-50 text-green-700 border-green-200",
    attending: "bg-green-50 text-green-700 border-green-200",
    declined: "bg-red-50 text-red-700 border-red-200",
    not_attending: "bg-red-50 text-red-700 border-red-200",
    maybe: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const cls = variants[s] ?? variants.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        cls,
        className
      )}
    >
      {s}
    </span>
  );
}

interface GuestFormFieldsComponentProps {
  form: GuestFormFields;
  setForm: (updater: (prev: GuestFormFields) => GuestFormFields) => void;
  groups: { id: string; name: string }[];
  usernameError?: string | null;
}

export function GuestFormFieldsComponent({
  form,
  setForm,
  groups,
  usernameError,
}: GuestFormFieldsComponentProps) {
  const inputClass =
    "w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30";

  const update = <K extends keyof GuestFormFields>(key: K, value: GuestFormFields[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        placeholder="Jane Doe"
        required
        autoFocus
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="jane@example.com"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="555-0100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-dash-text mb-1">
            Username
          </label>
          <input
            className={cn(inputClass, usernameError ? "border-dash-danger" : "")}
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            placeholder="auto-generated if blank"
          />
          {usernameError && (
            <p className="mt-1 text-xs text-dash-danger">{usernameError}</p>
          )}
        </div>
        <Select
          label="Side"
          value={form.side}
          onChange={(e) => update("side", e.target.value)}
        >
          {SIDES.map((s) => (
            <option key={s} value={s}>
              {s || "—"}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Group"
          value={form.group_id}
          onChange={(e) => {
            const g = groups.find((g) => g.id === e.target.value);
            setForm((prev) => ({
              ...prev,
              group_id: e.target.value,
              group_name: g?.name ?? "",
            }));
          }}
        >
          <option value="">— No group —</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <Input
          label="Guest Count"
          type="number"
          min="1"
          value={form.guest_count}
          onChange={(e) => update("guest_count", e.target.value)}
          placeholder="1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Table Number"
          value={form.table_number}
          onChange={(e) => update("table_number", e.target.value)}
          placeholder="Table 1"
        />
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.plus_one_allowed}
              onChange={(e) => update("plus_one_allowed", e.target.checked)}
              className="h-4 w-4 rounded border-dash-border accent-dash-primary"
            />
            <span className="text-sm text-dash-text">Plus one allowed</span>
          </label>
        </div>
      </div>
      <Input
        label="Dietary Notes"
        value={form.dietary_notes}
        onChange={(e) => update("dietary_notes", e.target.value)}
        placeholder="Vegetarian, allergies, etc."
      />
    </div>
  );
}
