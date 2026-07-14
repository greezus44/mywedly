import React, { useState, useEffect } from "react";
import type { EventGuest, GuestGroup } from "../../lib/supabase";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { FormField, Badge, Toggle } from "../../components/ui";
import { cn } from "../../lib/utils";

export interface GuestFormData {
  name: string;
  email: string;
  phone: string;
  group_id: string | null;
  group_name: string;
  side: string;
  rsvp_status: string;
  plus_ones: number;
  dietary: string;
  message: string;
  table_number: string;
}

export function guestToForm(guest: EventGuest): GuestFormData {
  return {
    name: guest.name || "",
    email: guest.email || "",
    phone: guest.phone || "",
    group_id: guest.group_id,
    group_name: guest.group_name || "",
    side: guest.side || "",
    rsvp_status: guest.rsvp_status || "pending",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary || "",
    message: guest.message || "",
    table_number: guest.table_number || "",
  };
}

export function emptyGuestForm(): GuestFormData {
  return {
    name: "",
    email: "",
    phone: "",
    group_id: null,
    group_name: "",
    side: "",
    rsvp_status: "pending",
    plus_ones: 0,
    dietary: "",
    message: "",
    table_number: "",
  };
}

interface GuestFormProps {
  initial: GuestFormData;
  groups: GuestGroup[];
  onChange: (data: GuestFormData) => void;
}

export function GuestForm({ initial, groups, onChange }: GuestFormProps) {
  const [data, setData] = useState<GuestFormData>(initial);

  useEffect(() => {
    setData(initial);
  }, [initial]);

  const update = (patch: Partial<GuestFormData>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name">
          <Input
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Guest name"
          />
        </FormField>
        <FormField label="Email">
          <Input
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="guest@email.com"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Phone">
          <Input
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="Optional"
          />
        </FormField>
        <FormField label="Side">
          <Select
            value={data.side}
            onChange={(e) => update({ side: e.target.value })}
          >
            <option value="">—</option>
            <option value="bride">Bride</option>
            <option value="groom">Groom</option>
            <option value="both">Both</option>
            <option value="other">Other</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Guest Group">
        <Select
          value={data.group_id ?? ""}
          onChange={(e) => {
            const groupId = e.target.value || null;
            const group = groups.find((g) => g.id === groupId);
            update({ group_id: groupId, group_name: group?.name ?? "" });
          }}
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="RSVP Status">
          <Select
            value={data.rsvp_status}
            onChange={(e) => update({ rsvp_status: e.target.value })}
          >
            <option value="pending">Pending</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
          </Select>
        </FormField>
        <FormField label="Plus Ones">
          <Input
            type="number"
            min={0}
            value={data.plus_ones}
            onChange={(e) => update({ plus_ones: parseInt(e.target.value) || 0 })}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Table Number">
          <Input
            value={data.table_number}
            onChange={(e) => update({ table_number: e.target.value })}
            placeholder="Optional"
          />
        </FormField>
        <FormField label="Dietary">
          <Input
            value={data.dietary}
            onChange={(e) => update({ dietary: e.target.value })}
            placeholder="e.g., Vegetarian"
          />
        </FormField>
      </div>

      <FormField label="Message">
        <Textarea
          value={data.message}
          onChange={(e) => update({ message: e.target.value })}
          placeholder="Optional guest message"
          rows={2}
        />
      </FormField>
    </div>
  );
}

export function RsvpBadge({ status }: { status: string | null }) {
  switch (status) {
    case "attending":
      return <Badge variant="success">Attending</Badge>;
    case "declined":
      return <Badge variant="danger">Declined</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="default">Pending</Badge>;
  }
}
