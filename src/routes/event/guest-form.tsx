import React from "react";
import { Badge } from "../../components/ui";

export interface GuestForm {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string;
  group_name: string;
  side: string;
  plus_ones: number;
  dietary: string;
  table_number: number | null;
}

export const EMPTY_GUEST_FORM: GuestForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  group_id: "",
  group_name: "",
  side: "",
  plus_ones: 0,
  dietary: "",
  table_number: null,
};

export function guestToForm(guest: {
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  group_id: string | null;
  group_name: string | null;
  side: string | null;
  plus_ones: number;
  dietary: string | null;
  table_number: number | null;
}): GuestForm {
  return {
    name: guest.name,
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_id: guest.group_id ?? "",
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    plus_ones: guest.plus_ones ?? 0,
    dietary: guest.dietary ?? "",
    table_number: guest.table_number ?? null,
  };
}

export function RsvpBadge({ status }: { status: string }) {
  const variant =
    status === "attending"
      ? "success"
      : status === "not_attending"
      ? "danger"
      : "warning";
  return <Badge variant={variant as "success" | "danger" | "warning"}>{status}</Badge>;
}

export const GUEST_FORM_FIELDS = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "username", label: "Username", type: "text", required: false },
  { key: "email", label: "Email", type: "email", required: false },
  { key: "phone", label: "Phone", type: "tel", required: false },
  { key: "plus_ones", label: "Plus Ones", type: "number", required: false },
  { key: "dietary", label: "Dietary Requirements", type: "text", required: false },
  { key: "table_number", label: "Table Number", type: "number", required: false },
] as const;
