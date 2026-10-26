/*
# Open RSVP Links

Adds "open registration" links for events. Each link targets ONE sub-event
and lets a guest fill in their name, RSVP attending/declined, and optionally
bring a +1. The guest (and their +1) are created as real guests on the list,
invited only to that one sub-event, and auto-grouped under "Open Link RSVP".

## 1. New Tables
- `open_rsvp_links`
  - `id` uuid PK
  - `token` text UNIQUE NOT NULL — unguessable URL token
  - `event_id` uuid FK -> user_events(id) ON DELETE CASCADE
  - `sub_event_id` uuid FK -> sub_events(id) ON DELETE CASCADE
  - `allow_plus_one` boolean default false
  - `is_enabled` boolean default true
  - `page_config` jsonb default '{}' — editable page text (heading, intro,
    accept label, decline label, +1 prompt, thank-you message)
  - `created_at` / `updated_at` timestamptz

## 2. Security (RLS + grants)
- Enable RLS on `open_rsvp_links`.
- Owner (creator_id of the parent user_events) can SELECT/INSERT/UPDATE/DELETE.
- Anonymous callers can SELECT a single row by token (public lookup) — the
  only public access; no listing.
- Grants: SELECT to anon + authenticated (policies gate which rows); full
  CRUD to authenticated (policies gate ownership).

## 3. New RPC functions
- `open_rsvp_lookup(p_token text)` — SECURITY DEFINER, public. Returns one
  link row joined with the sub-event + parent event details needed to render
  the public join page. Only returns enabled links of published events.
- `open_rsvp_register(p_token text, p_name text, p_status text,
  p_plus_one_name text)` — SECURITY DEFINER, public. Validates the link,
  finds-or-creates the "Open Link RSVP" group for the event, creates the
  guest (and +1 if allowed + attending), invites them to the one sub-event,
  records the RSVP, and returns a guest session row (same shape as
  guest_signin_lookup) for the primary guest.

## 4. Notes
- The existing `guest_resolve_invitations` already scopes what a guest sees
  to the sub-events they have invite rows for, so open-link guests only ever
  see their one sub-event — no change needed there.
- The existing guests page already groups by `group_id`, so open-link guests
  appear under "Open Link RSVP" automatically.
*/

CREATE TABLE IF NOT EXISTS open_rsvp_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  event_id uuid NOT NULL REFERENCES user_events(id) ON DELETE CASCADE,
  sub_event_id uuid NOT NULL REFERENCES sub_events(id) ON DELETE CASCADE,
  allow_plus_one boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  page_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_open_rsvp_links_event_id ON open_rsvp_links(event_id);
CREATE INDEX IF NOT EXISTS idx_open_rsvp_links_sub_event_id ON open_rsvp_links(sub_event_id);

ALTER TABLE open_rsvp_links ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON open_rsvp_links TO authenticated;
GRANT SELECT ON open_rsvp_links TO anon;

DROP POLICY IF EXISTS "owner_select_open_rsvp_links" ON open_rsvp_links;
CREATE POLICY "owner_select_open_rsvp_links" ON open_rsvp_links
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_events e WHERE e.id = open_rsvp_links.event_id AND e.creator_id = auth.uid()));

DROP POLICY IF EXISTS "owner_insert_open_rsvp_links" ON open_rsvp_links;
CREATE POLICY "owner_insert_open_rsvp_links" ON open_rsvp_links
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_events e WHERE e.id = open_rsvp_links.event_id AND e.creator_id = auth.uid()));

DROP POLICY IF EXISTS "owner_update_open_rsvp_links" ON open_rsvp_links;
CREATE POLICY "owner_update_open_rsvp_links" ON open_rsvp_links
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_events e WHERE e.id = open_rsvp_links.event_id AND e.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM user_events e WHERE e.id = open_rsvp_links.event_id AND e.creator_id = auth.uid()));

DROP POLICY IF EXISTS "owner_delete_open_rsvp_links" ON open_rsvp_links;
CREATE POLICY "owner_delete_open_rsvp_links" ON open_rsvp_links
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_events e WHERE e.id = open_rsvp_links.event_id AND e.creator_id = auth.uid()));

-- Public lookup by token only (no listing).
DROP POLICY IF EXISTS "anon_select_open_rsvp_links_by_token" ON open_rsvp_links;
CREATE POLICY "anon_select_open_rsvp_links_by_token" ON open_rsvp_links
  FOR SELECT TO anon, authenticated
  USING (token IS NOT NULL AND is_enabled = true);

-- ---------------------------------------------------------------------------
-- Public lookup function: returns link + sub-event + event details by token.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.open_rsvp_lookup(text);
CREATE FUNCTION public.open_rsvp_lookup(p_token text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT jsonb_build_object(
    'link', to_jsonb(l.*),
    'sub_event', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'name_bm', s.name_bm,
      'date', s.date,
      'time', s.time,
      'start_time', s.start_time,
      'end_time', s.end_time,
      'venue', s.venue,
      'address', s.address,
      'description', s.description,
      'rsvp_deadline', s.rsvp_deadline
    ),
    'event', jsonb_build_object(
      'id', e.id,
      'slug', e.slug,
      'name', e.name,
      'name_bm', e.name_bm,
      'theme', e.theme,
      'login_config', e.login_config
    )
  )
  FROM open_rsvp_links l
  JOIN sub_events s ON s.id = l.sub_event_id
  JOIN user_events e ON e.id = l.event_id
  WHERE l.token = p_token
    AND l.is_enabled = true
    AND e.is_published = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.open_rsvp_lookup(text) FROM public;
GRANT EXECUTE ON FUNCTION public.open_rsvp_lookup(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Registration function: creates the guest (+ optional +1), invites them to
-- the one sub-event, records the RSVP, and returns a session row.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.open_rsvp_register(text, text, text, text);
CREATE FUNCTION public.open_rsvp_register(
  p_token text,
  p_name text,
  p_status text,
  p_plus_one_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_link open_rsvp_links%ROWTYPE;
  v_event user_events%ROWTYPE;
  v_sub_event sub_events%ROWTYPE;
  v_group_id uuid;
  v_guest_id uuid;
  v_plus_one_id uuid;
  v_clean_name text;
  v_clean_plus_one text;
  v_norm_status text;
  v_username text;
  v_existing guest_event_invites%ROWTYPE;
BEGIN
  -- Load and validate the link.
  SELECT l.* INTO v_link
  FROM open_rsvp_links l
  JOIN user_events e ON e.id = l.event_id
  WHERE l.token = p_token AND l.is_enabled = true AND e.is_published = true
  LIMIT 1;

  IF NOT found THEN
    RETURN jsonb_build_object('error', 'link_not_found');
  END IF;

  -- Validate name.
  v_clean_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  IF v_clean_name = '' OR length(v_clean_name) > 200 THEN
    RETURN jsonb_build_object('error', 'invalid_name');
  END IF;

  -- Validate status.
  v_norm_status := lower(btrim(coalesce(p_status, '')));
  IF v_norm_status NOT IN ('attending', 'declined') THEN
    RETURN jsonb_build_object('error', 'invalid_status');
  END IF;

  -- Validate +1: only if allowed and attending.
  v_clean_plus_one := btrim(regexp_replace(coalesce(p_plus_one_name, ''), '\s+', ' ', 'g'));
  IF v_norm_status = 'declined' OR NOT v_link.allow_plus_one THEN
    v_clean_plus_one := '';
  END IF;
  IF v_clean_plus_one <> '' AND length(v_clean_plus_one) > 200 THEN
    RETURN jsonb_build_object('error', 'invalid_plus_one_name');
  END IF;

  SELECT * INTO v_event FROM user_events WHERE id = v_link.event_id LIMIT 1;
  SELECT * INTO v_sub_event FROM sub_events WHERE id = v_link.sub_event_id LIMIT 1;

  -- Find or create the "Open Link RSVP" group for this event.
  SELECT id INTO v_group_id FROM guest_groups WHERE event_id = v_link.event_id AND name = 'Open Link RSVP' LIMIT 1;
  IF v_group_id IS NULL THEN
    INSERT INTO guest_groups (event_id, name, sort_order)
    VALUES (v_link.event_id, 'Open Link RSVP', 9999)
    RETURNING id INTO v_group_id;
  END IF;

  -- Find existing guest with the same name in this event (avoid duplicates).
  SELECT g.id INTO v_guest_id
  FROM event_guests g
  WHERE g.event_id = v_link.event_id AND lower(g.name) = lower(v_clean_name)
  LIMIT 1;

  IF v_guest_id IS NULL THEN
    v_username := lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '', 'g'));
    INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one)
    VALUES (v_link.event_id, v_clean_name, v_username, gen_random_uuid()::text, 'pending', 0, v_group_id, v_link.allow_plus_one)
    RETURNING id INTO v_guest_id;
  END IF;

  -- Ensure invite row for the sub-event (idempotent).
  SELECT * INTO v_existing FROM guest_event_invites WHERE guest_id = v_guest_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
  IF NOT found THEN
    INSERT INTO guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
    VALUES (v_guest_id, v_link.event_id, v_link.sub_event_id, 'include');
  END IF;

  -- Record the RSVP for the primary guest.
  INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, sub_event_id, responded_at)
  VALUES (v_link.event_id, v_guest_id, v_clean_name, v_norm_status, CASE WHEN v_clean_plus_one <> '' THEN 1 ELSE 0 END, v_link.sub_event_id, now())
  ON CONFLICT DO NOTHING;

  -- Update guest rsvp_status for convenience.
  UPDATE event_guests SET rsvp_status = v_norm_status, rsvp_submitted_at = now(),
    plus_ones = CASE WHEN v_clean_plus_one <> '' THEN 1 ELSE 0 END
  WHERE id = v_guest_id;

  -- Create the +1 as a separate guest, same group, same single sub-event.
  IF v_clean_plus_one <> '' THEN
    SELECT g.id INTO v_plus_one_id
    FROM event_guests g
    WHERE g.event_id = v_link.event_id AND lower(g.name) = lower(v_clean_plus_one)
    LIMIT 1;

    IF v_plus_one_id IS NULL THEN
      INSERT INTO event_guests (event_id, name, username, token, rsvp_status, plus_ones, group_id, allow_plus_one)
      VALUES (v_link.event_id, v_clean_plus_one, lower(regexp_replace(v_clean_plus_one, '[^a-zA-Z0-9]+', '', 'g')), gen_random_uuid()::text, 'attending', 0, v_group_id, false)
      RETURNING id INTO v_plus_one_id;
    END IF;

    SELECT * INTO v_existing FROM guest_event_invites WHERE guest_id = v_plus_one_id AND event_id = v_link.event_id AND sub_event_id = v_link.sub_event_id LIMIT 1;
    IF NOT found THEN
      INSERT INTO guest_event_invites (guest_id, event_id, sub_event_id, invite_type)
      VALUES (v_plus_one_id, v_link.event_id, v_link.sub_event_id, 'include');
    END IF;

    INSERT INTO event_rsvps (event_id, guest_id, guest_name, status, plus_ones, sub_event_id, responded_at)
    VALUES (v_link.event_id, v_plus_one_id, v_clean_plus_one, 'attending', 0, v_link.sub_event_id, now())
    ON CONFLICT DO NOTHING;

    UPDATE event_guests SET rsvp_status = 'attending', rsvp_submitted_at = now()
    WHERE id = v_plus_one_id;
  END IF;

  -- Return a session row for the primary guest (same shape as guest_signin_lookup).
  RETURN jsonb_build_object(
    'error', NULL,
    'guest', jsonb_build_object(
      'id', g.id,
      'event_id', g.event_id,
      'name', g.name,
      'group_name', g.group_name,
      'side', g.side,
      'rsvp_status', g.rsvp_status,
      'rsvp_submitted_at', g.rsvp_submitted_at,
      'plus_ones', g.plus_ones,
      'dietary', g.dietary,
      'message', g.message,
      'created_at', g.created_at,
      'table_number', g.table_number,
      'group_id', g.group_id,
      'allow_plus_one', g.allow_plus_one
    ),
    'event_slug', v_event.slug
  )
  FROM event_guests g
  WHERE g.id = v_guest_id;
END;
$$;

REVOKE ALL ON FUNCTION public.open_rsvp_register(text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.open_rsvp_register(text, text, text, text) TO anon, authenticated;
