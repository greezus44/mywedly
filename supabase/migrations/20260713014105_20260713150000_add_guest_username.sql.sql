-- Add username column to guests table for username-based login.
-- Usernames must be unique within each wedding (not per event, since guests belong to weddings).
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS username text;

-- Generate usernames for existing guests from their full_name (lowercase, no spaces)
UPDATE public.guests
SET username = lower(regexp_replace(full_name, '[^a-zA-Z0-9]', '', 'g'))
WHERE username IS NULL;

-- Add unique constraint: username unique per wedding
CREATE UNIQUE INDEX IF NOT EXISTS guests_wedding_username_unique
  ON public.guests (wedding_id, lower(coalesce(username, '')))
  WHERE username IS NOT NULL;

-- Drop old name-based unique index since we're switching to username-based login
DROP INDEX IF EXISTS guests_wedding_name_unique;

-- Update guest_signin to use username instead of full_name
DROP FUNCTION IF EXISTS public.guest_signin(text, text);

CREATE OR REPLACE FUNCTION public.guest_signin(p_slug text, p_username text)
RETURNS TABLE(guest_id uuid, wedding_id uuid, out_full_name text, group_id uuid)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  w RECORD; g RECORD; new_id uuid;
  v_username text := lower(trim(coalesce(p_username, '')));
BEGIN
  IF v_username = '' THEN RETURN; END IF;
  SELECT id, is_published INTO w FROM public.weddings WHERE slug = p_slug;
  IF NOT FOUND OR NOT w.is_published THEN RETURN; END IF;
  SELECT gs.id, gs.wedding_id, gs.full_name, gs.group_id INTO g
    FROM public.guests gs
    WHERE gs.wedding_id = w.id AND lower(gs.username) = v_username LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  guest_id := g.id; wedding_id := g.wedding_id;
  out_full_name := g.full_name; group_id := g.group_id;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.guest_signin(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_signin(text, text) TO anon, authenticated;

-- Grant anon SELECT on username column (needed for SECURITY INVOKER)
-- Already covered by existing "anon read guests for published weddings" policy
