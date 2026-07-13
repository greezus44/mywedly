/*
# Fix: Function Search Path Mutable

## Purpose
The function `public.update_updated_at_column()` has a role-mutable `search_path`,
which is a security vulnerability. An attacker who can create objects in a schema
that appears earlier in the search path could shadow built-in functions like `now()`
and execute arbitrary code when the trigger fires.

## Fix
Recreate the function with an explicit, immutable `search_path = public` so that
function resolution is locked to the `public` schema regardless of the caller's
search_path setting.

## Notes
1. The function body is unchanged — only the `search_path` is added.
2. The function is `SECURITY INVOKER` by default (no change), so it runs with the
   caller's privileges, but now with a fixed search_path.
3. Existing triggers that reference this function are unaffected — `CREATE OR REPLACE`
   keeps the same function OID.
*/

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
