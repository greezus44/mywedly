-- F1/F2/F3/F21: guests must not be readable or writable by anonymous callers.
DROP POLICY IF EXISTS anon_select_event_guests ON public.event_guests;
DROP POLICY IF EXISTS guest_insert_event_guests ON public.event_guests;
DROP POLICY IF EXISTS guest_update_event_guests ON public.event_guests;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.event_guests FROM anon;

-- Lookups used by the guest sign-in flow, narrowed so they no longer return
-- the sign-in username or the invitation token.
DROP FUNCTION IF EXISTS public.guest_signin_lookup(uuid, text);
DROP FUNCTION IF EXISTS public.guest_session_lookup(uuid, uuid);

CREATE FUNCTION public.guest_signin_lookup(p_event_id uuid, p_username text)
RETURNS TABLE(id uuid, event_id uuid, name text, group_name text, side text,
  rsvp_status text, rsvp_submitted_at timestamptz, plus_ones integer,
  dietary text, message text, created_at timestamptz, table_number text,
  group_id uuid, allow_plus_one boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT g.id, g.event_id, g.name, g.group_name, g.side, g.rsvp_status,
         g.rsvp_submitted_at, g.plus_ones, g.dietary, g.message, g.created_at,
         g.table_number, g.group_id, g.allow_plus_one
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.event_id = p_event_id
    AND e.is_published = true
    AND g.username IS NOT NULL
    AND lower(g.username) = lower(btrim(coalesce(p_username, '')))
    AND btrim(coalesce(p_username, '')) <> ''
  LIMIT 1;
$$;

CREATE FUNCTION public.guest_session_lookup(p_guest_id uuid, p_event_id uuid)
RETURNS TABLE(id uuid, event_id uuid, name text, group_name text, side text,
  rsvp_status text, rsvp_submitted_at timestamptz, plus_ones integer,
  dietary text, message text, created_at timestamptz, table_number text,
  group_id uuid, allow_plus_one boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT g.id, g.event_id, g.name, g.group_name, g.side, g.rsvp_status,
         g.rsvp_submitted_at, g.plus_ones, g.dietary, g.message, g.created_at,
         g.table_number, g.group_id, g.allow_plus_one
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.id = p_guest_id
    AND g.event_id = p_event_id
    AND e.is_published = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.guest_signin_lookup(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.guest_session_lookup(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.guest_signin_lookup(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guest_session_lookup(uuid, uuid) TO anon, authenticated;
