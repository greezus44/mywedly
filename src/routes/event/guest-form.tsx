import React from "react";
import { Badge } from "../../components/ui";

export interface GuestFormValues {
  name: string;
  username: string;
  email: string;
  phone: string;
  group_id: string | null;
  group_name: string;
  side: string;
  plus_ones: number;
  rsvp_status: string;
  dietary: string;
  message: string;
  table_number: number | null;
}

export const EMPTY_GUEST_FORM: GuestFormValues = {
  name: "",
  username: "",
  email: "",
  phone: "",
  group_id: null,
  group_name: "",
  side: "",
  plus_ones: 0,
  rsvp_status: "pending",
  dietary: "",
  message: "",
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
  rsvp_status: string;
  dietary: string | null;
  message: string | null;
  table_number: number | null;
}): GuestFormValues {
  return {
    name: guest.name,
    username: guest.username ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    group_id: guest.group_id,
    group_name: guest.group_name ?? "",
    side: guest.side ?? "",
    plus_ones: guest.plus_ones,
    rsvp_status: guest.rsvp_status,
    dietary: guest.dietary ?? "",
    message: guest.message ?? "",
    table_number: guest.table_number,
  };
}

export function RsvpBadge({ status }: { status: string }) {
  if (status === "attending" || status === "yes")
    return <Badge variant="success">Attending</Badge>;
  if (status === "not_attending" || status === "no")
    return <Badge variant="danger">Not Attending</Badge>;
  if (status === "maybe")
    return <Badge variant="warning">Maybe</Badge>;
  return <Badge variant="default">Pending</Badge>;
}

export const GUEST_FORM_FIELDS = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "username", label: "Username", type: "text", required: false },
  { key: "email", label: "Email", type: "email", required: false },
  { key: "phone", label: "Phone", type: "tel", required: false },
  { key: "plus_ones", label: "Plus Ones", type: "number", required: false },
  { key: "table_number", label: "Table Number", type: "number", required: false },
  { key: "dietary", label: "Dietary Requirements", type: "text", required: false },
  { key: "side", label: "Side", type: "text", required: false },
] as const;

export const RSVP_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "attending", label: "Attending" },
  { value: "not_attending", label: "Not Attending" },
  { value: "maybe", label: "Maybe" },
] as const;
