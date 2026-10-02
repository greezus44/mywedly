-- F6: unpublished draft events must not be readable by the public.
DROP POLICY IF EXISTS guest_read_user_events ON public.user_events;

-- F12: guest wishes are readable only for the published event they belong to.
DROP POLICY IF EXISTS guest_read_event_message ON public.event_messages;
CREATE POLICY guest_read_event_message ON public.event_messages
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM user_events e
    WHERE e.id = event_messages.event_id AND e.is_published = true
  ));

-- F13: schedules are readable only for published events.
DROP POLICY IF EXISTS guest_read_event_schedule ON public.event_schedule;
CREATE POLICY guest_read_event_schedule ON public.event_schedule
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM user_events e
    WHERE e.id = event_schedule.event_id AND e.is_published = true
  ));
