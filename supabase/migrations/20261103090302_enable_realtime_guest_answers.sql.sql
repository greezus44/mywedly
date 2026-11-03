/*
# Enable live updates for guest answers

1. Modified publication
- Adds `event_guests` and `event_rsvps` to the built-in realtime publication so changes to guest answers are broadcast to open screens.

2. Security
- No policy or grant changes. Realtime delivers only rows the signed-in host can already read under the existing owner-scoped SELECT policies.

3. Notes
- The steps are idempotent: a table is only added if it is not already in the publication.
*/

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['event_guests', 'event_rsvps'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
