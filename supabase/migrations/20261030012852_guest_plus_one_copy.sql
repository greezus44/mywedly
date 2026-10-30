/*
# Guest plus-one question wording from the open invite

1. New function
- `guest_plus_one_copy(p_guest_id, p_event_id)` returns the plus-one question and Yes/No labels (English and Bahasa Malaysia) that the guest's open RSVP invite uses.
- Returns an empty object when the guest was not registered through an open RSVP link, or when the event is not published.

2. Security
- Function runs as its owner so it can read the open invite settings.
- Only the guest's own event and guest id are used; no other rows are exposed.
- EXECUTE is granted to anon and authenticated, matching the existing guest phone functions.
*/

CREATE OR REPLACE FUNCTION public.guest_plus_one_copy(p_guest_id uuid, p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_guest event_guests%ROWTYPE;
  v_link open_rsvp_links%ROWTYPE;
BEGIN
  SELECT g.* INTO v_guest
  FROM event_guests g
  JOIN user_events e ON e.id = g.event_id
  WHERE g.id = p_guest_id AND g.event_id = p_event_id AND e.is_published = true;

  IF NOT found OR v_guest.open_rsvp_link_id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT * INTO v_link FROM open_rsvp_links WHERE id = v_guest.open_rsvp_link_id;
  IF NOT found THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'question', v_link.page_config ->> 'plusOneQuestion',
    'questionBm', v_link.page_config ->> 'plusOneQuestionBm',
    'yesLabel', v_link.page_config ->> 'plusOneYesLabel',
    'yesLabelBm', v_link.page_config ->> 'plusOneYesLabelBm',
    'noLabel', v_link.page_config ->> 'plusOneNoLabel',
    'noLabelBm', v_link.page_config ->> 'plusOneNoLabelBm'
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.guest_plus_one_copy(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guest_plus_one_copy(uuid, uuid) TO anon, authenticated;
