/*
# Primary Open RSVP link per event

## Summary
Each event now has exactly one "primary" Open RSVP link whose page
configuration (logo, heading, button labels, colors, typography, plus-one
setting, etc.) is the shared style for every Open RSVP link on that event.
Extra links inherit that style and are no longer independently editable for
appearance — only their URL, group, and deadline differ.

## 1. Schema changes
- `open_rsvp_links.is_primary` (boolean, NOT NULL, default false) — marks the
  link whose page_config + allow_plus_one govern the shared look for the
  event. At most one link per event can be primary.

## 2. Backfill
- For each event that already has links, mark the oldest link (by created_at,
  then by id as a tiebreaker) as primary so existing setups keep a
  well-defined style source.

## 3. Index
- Partial unique index on `(event_id) WHERE is_primary = true` so each event
  has at most one primary link.

## 4. Security
- No new RLS policies needed: the existing owner-scoped policies on
  open_rsvp_links cover the new column (row-level, not column-level).
- The host can flip the flag through the existing UPDATE grant.

## 5. Important notes
- The open_rsvp_link_lookup and open_rsvp_register functions are unchanged.
  They still read page_config from each link's own row. The frontend keeps
  every link's page_config in sync with the primary link's, so all links
  render identically regardless of which one a guest opens.
- No data is lost: existing per-link customizations on non-primary links
  remain on disk but are no longer editable from the UI. The host can make
  the styled link primary again by deleting/promoting as needed.
*/

ALTER TABLE open_rsvp_links
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Backfill: mark the oldest link per event as primary where none is primary yet.
WITH ranked AS (
  SELECT id, event_id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM open_rsvp_links
  WHERE event_id IS NOT NULL
)
UPDATE open_rsvp_links l
SET is_primary = true
FROM ranked r
WHERE l.id = r.id
  AND r.rn = 1
  AND NOT EXISTS (
    SELECT 1 FROM open_rsvp_links p
    WHERE p.event_id = l.event_id AND p.is_primary = true
  );

-- Ensure only one primary link per event.
CREATE UNIQUE INDEX IF NOT EXISTS idx_open_rsvp_links_one_primary_per_event
  ON open_rsvp_links (event_id)
  WHERE is_primary = true;
