-- F12: pin the search_path so the function cannot be made to resolve helper
-- objects from an attacker-controlled schema, and stop exposing it on the API
-- (no client code calls it; it is used by data-cleanup migrations only).
ALTER FUNCTION public.clean_rich_html(text) SET search_path TO 'public', 'pg_temp';

REVOKE EXECUTE ON FUNCTION public.clean_rich_html(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clean_rich_html(text) FROM anon;