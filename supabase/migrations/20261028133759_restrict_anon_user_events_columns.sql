/*
  # F9: hide draft columns of user_events from unauthenticated visitors

  RLS is row-level, so the published-event read policy exposed every column,
  including the draft_* columns the host has not published and draft_login_config.
  Anon now holds SELECT only on the published columns. The guest-facing queries
  are updated in the same change to request those columns explicitly.

  Authenticated hosts keep full column access (their own rows, via the existing
  creator policies), and the guest_* SECURITY DEFINER functions are unaffected.
*/

REVOKE SELECT ON public.user_events FROM anon;

GRANT SELECT (
  id,
  name,
  name_bm,
  event_type,
  event_date,
  event_time,
  venue,
  address,
  cover_image,
  cover_config,
  login_config,
  theme,
  logo_config,
  content,
  sharing_config,
  is_published,
  is_archived,
  published_at,
  created_at,
  updated_at,
  template_id,
  slug,
  rsvp_deadline
) ON public.user_events TO anon;