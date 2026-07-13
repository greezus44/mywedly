/*
# Fix overly-permissive guest RLS policies

## Problem
Three guest-facing RLS policies used `true` for USING/WITH CHECK, allowing
unrestricted access to anon and authenticated roles:

1. `event_guests.guest_update_event_guests` — UPDATE with USING(true) and WITH CHECK(true)
2. `event_messages.guest_insert_event_message` — INSERT with WITH CHECK(true)
3. `event_rsvps.guest_insert_event_rsvp` — INSERT with WITH CHECK(true)

## Fix
Replace the `true` clauses with a check that the referenced event exists in
`user_events` AND is published (`is_published = true`). This ensures guests can
only interact with events the creator has explicitly published, not draft or
unpublished events.

## Changes
- `event_guests.guest_update_event_guests`: USING and WITH CHECK now verify the
  event is published.
- `event_messages.guest_insert_event_message`: WITH CHECK now verifies the event
  is published.
- `event_rsvps.guest_insert_event_rsvp`: WITH CHECK now verifies the event is
  published.

## Security
- No new tables or columns.
- No data loss — only policy definitions change.
- Guest read policies (`guest_read_*`) remain `true` since reads are needed for
  public event pages and are intentionally open.
*/

-- Fix 1: event_guests guest UPDATE — scope to published events only
DROP POLICY IF EXISTS "guest_update_event_guests" ON public.event_guests;
CREATE POLICY "guest_update_event_guests"
  ON public.event_guests FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_events
      WHERE user_events.id = event_guests.event_id
        AND user_events.is_published = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_events
      WHERE user_events.id = event_guests.event_id
        AND user_events.is_published = true
    )
  );

-- Fix 2: event_messages guest INSERT — scope to published events only
DROP POLICY IF EXISTS "guest_insert_event_message" ON public.event_messages;
CREATE POLICY "guest_insert_event_message"
  ON public.event_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_events
      WHERE user_events.id = event_messages.event_id
        AND user_events.is_published = true
    )
  );

-- Fix 3: event_rsvps guest INSERT — scope to published events only
DROP POLICY IF EXISTS "guest_insert_event_rsvp" ON public.event_rsvps;
CREATE POLICY "guest_insert_event_rsvp"
  ON public.event_rsvps FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_events
      WHERE user_events.id = event_rsvps.event_id
        AND user_events.is_published = true
    )
  );
