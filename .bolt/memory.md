# Project memory

## Product intent & audience

- Event/guest management app with a **Guests** tab for tracking RSVPs across events.
- Guests have first/last names, status (attending/declined/no reply), +1 counts, and belong to groups.
- Bilingual support: guest names exist in **two languages**, both searchable.

## Brand personality & voice

- Clear, practical, plain-language UI copy (e.g., "Search guests by name", "No guests match your search").
- No marketing tone; utility-focused.

## Visual design & UX direction

- **Responsive**: works on phone and desktop; search field placed at top of Guests tab for both.
- Two list modes: **grouped view** and **sorted view**.
- Status tabs (attending, declined, no reply) and an event selector coexist with search.
- Search is live (filter-as-you-type) with a clear/reset control.
- Counts (attending, +1) update to reflect currently shown guests.
- Empty state shown when no guests match.
- Existing interactions (select, export, edit) remain functional during active search.

## Decisions, constraints & rationale

- **Name-only search**: matches first, last, and full names in both supported languages; does **not** search email or phone.
- **Hide non-matching**: guests and groups with no matches are hidden entirely (not greyed/out dimmed).
- Matching is **case-insensitive** and tolerates extra whitespace.
- Search composes with status tabs and event selector (all filters apply together).
- Clearing search restores the full list unchanged.

## Open questions & assumptions

- Which two languages are supported? (not yet specified)
- What defines a "group" — household, table, or custom? (assumed household/social grouping)
- App type assumed event/wedding-planning based on guest/RSVP/+1 vocabulary.