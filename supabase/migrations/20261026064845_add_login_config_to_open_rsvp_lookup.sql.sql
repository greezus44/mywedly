-- Expose login_config on the open_rsvp_lookup event payload so the public
-- join page can reuse the host's custom button colors (same as signin).
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