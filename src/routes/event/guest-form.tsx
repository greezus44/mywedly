import { type EventGuest } from "../../lib/supabase";
import { Badge } from "../../components/ui";

export interface GuestFormValues {
  name: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  group_id: string | null;
  group_name: string | null;
  side: string | null;
  rsvp_status: string;
  plus_ones: number;
  dietary: string | null;
  message: string | null;
  table_number: string | null;
}

export function guestToForm(guest: EventGuest): GuestFormValues {
  return {
    name: guest.name,
    username: guest.username,
    email: guest.email,
    phone: guest.phone,
    group_id: guest.group_id,
    group_name: guest.group_name,
    side: guest.side,
    rsvp_status: guest.rsvp_status,
    plus_ones: guest.plus_ones,
    dietary: guest.dietary,
    message: guest.message,
    table_number: guest.table_number,
  };
}

export function emptyGuestForm(): GuestFormValues {
  return {
    name: "",
    username: null,
    email: null,
    phone: null,
    group_id: null,
    group_name: null,
    side: null,
    rsvp_status: "pending",
    plus_ones: 0,
    dietary: null,
    message: null,
    table_number: null,
  };
}

export function RsvpBadge({ status }: { status: string }) {
  switch (status) {
    case "attending":
      return <Badge variant="success">Attending</Badge>;
    case "not_attending":
      return <Badge variant="danger">Not Attending</Badge>;
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
}

export const RSVP_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "attending", label: "Attending" },
  { value: "not_attending", label: "Not Attending" },
];

export const SIDE_OPTIONS = [
  { value: "", label: "—" },
  { value: "bride", label: "Bride's side" },
  { value: "groom", label: "Groom's side" },
  { value: "host", label: "Host" },
  { value: "other", label: "Other" },
];
